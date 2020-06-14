google.load('visualization', '1.0', {'packages':['corechart']});
google.setOnLoadCallback(loadTotalTwitterData);

var markerMultipleScale = 10;

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
var selectedMarker = null;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(40.75,-74.00),
        zoom: 3
    });
    loadTweetMarkersAndCountries();
    // loadGeoJson('/datafiles/countries.geojson', 'ADMIN');
    // map.data.setStyle(styleFeature);

}

function loadGeoJson(filePath, idProperty) {
    map.data.loadGeoJson(filePath, {idPropertyName: idProperty});
    google.maps.event.addListenerOnce(this.map.data, 'addfeature', function () {
        loadTweetMarkersAndCountries();
    });
}

function loadTotalTwitterData(){
    $.getJSON('/get_total_twitter_data', function(aggTweets){
        var avgSentimentsPerDate = [];
        for(let date in aggTweets){
            avgSentimentsPerDate.push({'date': date, 'avg': aggTweets[date]})
        }
        initColumnChart(avgSentimentsPerDate);
    });
}

function initColumnChart(sentimentPerDate){
    var data = this.dataToDataTable(sentimentPerDate);

    chart = new google.visualization.ColumnChart(document.getElementById('columnChart'));

    drawChart(data, chartOptions);
}

function drawChart(data, options){
    chart.draw(data, options);
}

function loadTweetMarkersAndCountries(){
    $.getJSON('/get_tweets_with_locs', function(tweets){
        tweets.forEach(function(tweet){
            var sentiment = tweet['sentiment'];
            var latlng = new google.maps.LatLng(tweet['latitude'], tweet['longitude']);

            var scale = sentiment > 0 ? (sentiment * markerMultipleScale) : 3;
            var icon = {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: scale,
                fillColor: sentiment >= 0 ? 'green': 'red',
                fillOpacity: 1,
                strokeWeight: 0,
                strokeColor:sentiment >= 0 ? 'green': 'red'
            };

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

            marker.addListener('click', function(){
                selectedMarker = this;
                updateTweetBox(this.tweet_info);
            });

            // let feature = map.data.getFeatureById(tweet['country']);
            // if(feature) {
            //     var count = feature.getProperty('count_tweets');
            //     var sumSentiments = feature.getProperty('sum_sentiments')
            //     if (count !== undefined) {
            //         count++;
            //         sumSentiments += sentiment;
            //     } else {
            //         count = 1;
            //         sumSentiments = sentiment;
            //     }
            //     feature.setProperty('count_tweets', count);
            //     feature.setProperty('sum_sentiments', sumSentiments);
            // }
        });
    });

}

function updateTweetBox(tweetInfo){
    var twitterURL = "https://twitter.com/Interior/status/" + tweetInfo.id;
    $.getJSON("https://publish.twitter.com/oembed?url=" + twitterURL, function(response){
        var html = response['html'];
        document.getElementById('tweet-box').innerHTML = html;
    });
}

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

function styleFeature(feature) {
    var averageTweetScore = feature.getProperty('sum_sentiments') / feature.getProperty('count_tweets');
    var fillOpacity = averageTweetScore;
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
        fillOpacity: fillOpacity,
        zIndex: zIndex
    }

}

