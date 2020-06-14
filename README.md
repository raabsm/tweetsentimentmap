Sam Raab and Asher Willner
Tamid Tech Chapter Application
6-14-20

Tweet Sentiment Application

https://tamidtweetsentimentcolumbia.herokuapp.com/

As coronavirus continues to spread throughout the world and keep much of the world shut down, this application seeks to gauge the population sentiment from tweets made by users around the globe. The application has two parts. The first is a graph that displays the per-day average aggregate tweet sentiment throughout the world for tweets related to coronavirus. The second is a world map that displays markers with locations of various corona-related tweets. The size of the marker points to the extremity of the sentiment, either negative, neutral, or positive, and the color denotes the mood, red for negative, grey for neutral, and green for positive. Furthermore, the countries are highlighted with the corresponding color for the aggregate tweet sentiment for that country. Finally, whenever clicking on a marker, the tweet that generated the marker shows up in the right-hand corner.

On the backend, the application fetches tweets daily from the Twitter APLI and stores tweet data in a PostgreSQL database hosted on AWS RDS. And the old data is kept as well to inform the general sentiment over time.

After data is refreshed and the database is updated, the frontend queries the data to be displayed on the map. The frontend uses the Tornado framework to supply the web server, and the Google Maps API to display the world map.

In developing this project, we faced a couple of challenges. We had to learn new APIs and modules. Specifically, learning the Twitter API and textblob in order to fetch tweets and grade them with a sentiment. Furthermore, learning the Heroku platform was new for us, but it was very useful and user-friendly platform that was easy to learn and deploy the application.
Also, on the front-end, setting up the GoogleMaps API and implementing the marker colors, country color-coding, and tweet pop-up was a challenge.

If we could further this project, we would like to expand our Twitter search to different queries that would include similar sentiment on coronavirus, like terms "quarantine" and "masks." This could give a better understanding of the broader sentiment. Furthermore, we would add a feature that whenever rolling over a country, the aggregate per-day sentiment would pop-up in a chart similar to the one for the overall per-day sentiment. Lastly, we would like to add a feature that allows users to input a query-word and generate a similar for that query with sentiment markers for tweets related to that word.
