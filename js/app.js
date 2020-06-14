/**
 * First, Google must load the visualization library in order to perform chart operations.
 * After it is finished loading, it will call the loadTotalTwitterData function, to display the column chart.
 */
google.load('visualization', '1.0', {'packages':['corechart']});
google.setOnLoadCallback(loadTotalTwitterData);

//This is a scalar multiple to size each marker according to the magnitude of it's tweet sentiment
var markerMultipleScale = 10;

/**
 * This are static options for the Google Column Chart Visualization used to display the sentiment-per-date data
 */
var chartOptions = {
    title: 'Average Tweet Sentiment per Day',
    height: 200,
    width: 600,

    // adjust size of chart area
    chartArea: {
      // allow 70px for hAxis title and ticks
      height: 100,

      // allow 200px for vAxis title and ticks
      left: 100,

      // allow 50px for chart title
      top: 50,

      // allow 200px for legend on right
      width: 500
    },
    backgroundColor: {fill: 'transparent'},
    hAxis: {
        title: 'Date',
        minValue: 0
    },
    legend: {
        position: 'none'
    },
    vAxis: {
        title: 'Average Sentiment'
    },
    animation: {
        duration: 1000,
        easing: 'out',
    }
};

var map;
var chart;

/**
 * This function is responsible for initializing the map and loading the country geojson
 */
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(40.75,-74.00),
        zoom: 3
    });
    loadGeoJson('/datafiles/countries.geojson', 'ADMIN');

    //load the style function which will color the countries according to tweet sentiment
    map.data.setStyle(styleFeature);

}

function loadGeoJson(filePath, idProperty) {
    //idProperty is the country name
    map.data.loadGeoJson(filePath, {idPropertyName: idProperty});

    //wait for features to be added until we perform functions on those features
    google.maps.event.addListenerOnce(this.map.data, 'addfeature', function () {
        loadTweetMarkersAndCountries();
    });
}

/**
 * This function is responsible for querying the average twitter sentiment
 * for each day from the backend, and send ing it to the chart to initialize
 */
function loadTotalTwitterData(){
    $.getJSON('/get_total_twitter_data', function(aggTweets){
        var avgSentimentsPerDate = [];
        for(let date in aggTweets){
            avgSentimentsPerDate.push({'date': date, 'avg': aggTweets[date]})
        }
        initColumnChart(avgSentimentsPerDate);
    });
}

/**
 * Initializes the Column Chart with data from all around the world
 * @param sentimentPerDate
 */
function initColumnChart(sentimentPerDate){
    var data = this.dataToDataTable(sentimentPerDate);

    chart = new google.visualization.ColumnChart(document.getElementById('columnChart'));

    //draws the chart with the options given above and the formatted data
    drawChart(data, chartOptions);
}

function drawChart(data, options){
    chart.draw(data, options);
}

/**
 * Queries backend for tweets with location data, and plots the markers onto the map.
 * Also responsible for providing data to the geojson features (countires) so they color accordingly
 */
function loadTweetMarkersAndCountries(){
    $.getJSON('/get_tweets_with_locs', function(tweets){
        tweets.forEach(function(tweet){
            var sentiment = tweet['sentiment'];
            var latlng = new google.maps.LatLng(tweet['latitude'], tweet['longitude']);

            //calculate the size of the marker from the magnitude of the sentiment
            var scale = sentiment > 0 ? (sentiment * markerMultipleScale) : 3;

            //neutral marker color
            var markerColor = 'grey';
            //positive
            if(sentiment > 0){
                markerColor = 'green';
            }
            //negative
            else if(sentiment < 0){
                markerColor = 'red';
            }
            var icon = {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: scale,
                fillColor: markerColor,
                fillOpacity: 1,
                strokeWeight: 0,
                strokeColor:markerColor
            };

            //construct Google Maps Marker and add to map
            var marker = new google.maps.Marker({
               map: this.map,
               icon: icon,
               position: latlng,
               tweet_info:{
                   sentiment: sentiment,
                   id: tweet['id']
               },
               zIndex: 999
           });

            //add click function to send tweet id and update box in top-right
            marker.addListener('click', function(){
                updateTweetBox(this.tweet_info);
            });

            //grabs the feature of the country where the tweet was posted
            let feature = map.data.getFeatureById(tweet['country']);
            if(feature) {
                var count = feature.getProperty('count_tweets');
                var sumSentiments = feature.getProperty('sum_sentiments');

                //increment number of tweets in that country and total sentiment in that country
                if (count !== undefined) {
                    count++;
                    sumSentiments += sentiment;
                } else {
                    count = 1;
                    sumSentiments = sentiment;
                }
                //update the feature with the additional information
                //the feature will be styled in the styleFeature function
                feature.setProperty('count_tweets', count);
                feature.setProperty('sum_sentiments', sumSentiments);
            }
        });
    });

}

/**
 * Creates Twitter IFrame widget and adds it to the box on the top-right
 * @param tweetInfo
 */
function updateTweetBox(tweetInfo){
    $('#tweet-box').show();
    var tweet = document.getElementById("tweet");

    //grab tweet id of marker that was clicked
    var id = tweetInfo.id;

    //empty prior tweet
    tweet.innerHTML = "";

    //create new tweet widget from id
    twttr.widgets.createTweet(
      id, tweet,
      {
        conversation : 'none',    // or all
        cards        : 'hidden',  // or visible
        linkColor    : '#cc0000', // default is blue
        theme        : 'light'    // or dark
      });
}

/**
 * Constructs the Column Chart from the date and average sentiment for each day.
 * Colors each bar according to whether the average sentiment is positive or negative.
 * Returns the column chart to be constructed.
 * @param sentimentsPerDate
 * @returns {google.visualization.arrayToDataTable}
 */
function dataToDataTable(sentimentsPerDate){
    var data = [['Date', 'Sentiment', {role: "style"}]];

    for(let i = 0; i<sentimentsPerDate.length; i++){
        let date = sentimentsPerDate[i]['date'].substr(5);
        let avg = sentimentsPerDate[i]['avg'];
        let color = avg > 0 ? 'green' : 'red';
        data.push([date, avg, color]);
    }

    var returnData = google.visualization.arrayToDataTable(data);
    return returnData;
}

/**
 * This function is responsible for coloring each country feature
 * Does so based on data accumulated in loadTweetMarkersAndCountries
 * @param feature
 * @returns {{fillColor: string, fillOpacity: number, strokeWeight: number, strokeColor: string, zIndex: number}}
 */
function styleFeature(feature) {
    //calculates the average tweet sentiment in that country (Sum/count)
    var averageTweetScore = feature.getProperty('sum_sentiments') / feature.getProperty('count_tweets');

    //colors each country based on the sentiment: neutral: grey, positive: green, negative: red
    var fillColor = 'grey';
    if(averageTweetScore > 0){
        fillColor = 'green';
    }
    else if(averageTweetScore < 0){
        fillColor = 'red'
    }

    var outlineWeight = 0.5, zIndex = 1;

    return {
        strokeWeight: outlineWeight,
        strokeColor: '#fff',
        fillColor: fillColor,
        fillOpacity: 0.3,  // Makes more transparent so Markers are visible
        zIndex: zIndex
    }

}

/**
 * When clicking the "x" button on top right hand corner of tweet box, this function is triggered
 * Hides the box from user-view
 */
function deselectTweet(){
    $('#tweet-box').hide();
}

