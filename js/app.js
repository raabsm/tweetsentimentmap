
(function(){

    var markerMultipleScale = 10;

    var application = {
        avgSentimentsPerDate: [],
        chartOptions: {
            title: 'Average Tweet Sentiment per Day',
            chartArea: {width: '90%'},
            hAxis: {
                title: 'Date',
                minValue: 0
            },
            vAxis: {
                title: 'Average Sentiment'
            },
            animation: {
                duration: 1000,
                easing: 'out',
            }
        },

        init: function() {
            this.map = new Map(document.getElementById('map'), {
                zoom: 3
            });
            this.map.loadGeoJson('/datafiles/countries.geojson', 'Admin');
            this.loadTotalTwitterData();
            this.loadTweetMarkers();
        },

        loadTotalTwitterData: function(){
            $.getJSON('/get_total_twitter_data', function(aggTweets){
                for(let date in aggTweets){
                    this.avgSentimentsPerDate.push({'date': date, 'avg': aggTweets[date]})
                }
                this.initColumnChart(this.avgSentimentsPerDate);
            });
        },

        initColumnChart: function(sentimentPerDate){
            var data = this.dataToDataTable(sentimentPerDate);

            this.chart = new google.visualization.ColumnChart(document.getElementById('columnChart'));

            this.drawChart(data, this.options);
        },

        drawChart: function(data, options){
            this.chart.draw(data, options);
        },

        loadTweetMarkersAndCountries: function(){
            $.getJSON('/get_tweets_with_locs', function(tweets){
                tweets.forEach(function(tweet){
                    var coordinates = tweet['coordinates'];
                    var sentiment = tweet['sentiment'];
                    var latlng = new google.maps.LatLng(coordinates);

                    var icon = {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: (sentiment * markerMultipleScale).toFixed(0),
                        fillColor: sentiment > 0 ? 'greed': 'red',
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor:'grey'
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
                        application.map.deselectMarker();
                        application.updateTweetBox(this.tweet_info);
                        application.map.selectMarker(this);
                    });

                    this.map.addMarker(marker);
                });

            });

        },

        updateTweetBox: function(tweetInfo){
            var twitterURL = "https://twitter.com/Interior/status/" + tweetInfo.id;
            $.getJSON("https://publish.twitter.com/oembed?url=" + twitterURL, function(response){
                var html = response['html'];
                document.getElementById('tweet-box').innerHTML = html;
            });
        },

        dataToDataTable: function(sentimentsPerDate){
            var data = ['Date', 'Sentiment', {role: "style"}];

            for(let i = 0; i<sentimentsPerDate.length; i++){
                let date = sentimentPerDate[i]['date'];
                let avg = sentimentPerDate[i]['avg'];
                let color = avg > 0 ? 'green' : 'red';
                data.push([date, avg, color]);
            }

            data = google.visualization.arrayToDataTable(data);
            return data;
        }

    }


});