import psycopg2
from config import DB_INFO
from config import Google_Maps_API_KEY
import tornado.ioloop
import tornado.web
import tornado.httpserver
import json
import os

global cursor


# This handler renders the main html page with the GOOGLE MAPS API key as it's one argument
class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('/app/tweetsentimentmap/html/app.html', API_KEY=Google_Maps_API_KEY)


# This handler queries the average sentiment-per-day from the database, and sends that data back to the front-end
class GetTotals(tornado.web.RequestHandler):
    def get(self):
        resp = cursor.execute(
            'SELECT date_created, AVG(sentiment) FROM tweets GROUP BY date_created ORDER BY date_created');
        to_send = {}
        # formats the response as a key-value pair ({date: sentiment})
        for row in cursor.fetchall():
            to_send[str(row[0])] = float(row[1])
        self.write(to_send)


# This handler queries all of the tweets in the database that have location data, and sends that data back to the
# front-end in the form of a list of dictionaries, each containing id, date, sentiment, country, latitude and
# longitude data
class GetTweetsWithLocations(tornado.web.RequestHandler):
    def get(self):
        resp = cursor.execute('SELECT * FROM tweets WHERE country IS NOT NULL')
        to_send = []
        # formats the response as a list of dictionaries, each containing information on the location and sentiment
        # of a tweet
        for row in cursor.fetchall():
            row_info = {}
            # id field is necessary to query Twitter I-Frame
            row_info['id'] = str(row[0])
            row_info['date'] = str(row[1])
            row_info['sentiment'] = float(row[2])
            row_info['country'] = row[4][1:-1]
            row_info['longitude'] = float(row[5])
            row_info['latitude'] = float(row[6])
            to_send.append(row_info)
        self.write(json.dumps(to_send))


# This connects the DB using info provided by the configuration file.
def connect_db():
    global cursor
    try:
        connection = psycopg2.connect(user=DB_INFO['user'],
                                      password=DB_INFO['password'],
                                      host=DB_INFO['host'],
                                      port=DB_INFO['port'],
                                      database=DB_INFO['database']
                                      )
        connection.autocommit = True
        cursor = connection.cursor()

    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to DB", error)


# This method navigates the web server to the correct handler
def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/get_total_twitter_data", GetTotals),
        (r"/get_tweets_with_locs", GetTweetsWithLocations),

        # Static file handler to access js, css, and geojson files

        (r"/datafiles/(.*)", tornado.web.StaticFileHandler, {"path": "/app/tweetsentimentmap/datafiles/"}),
        (r"/js/(.*)", tornado.web.StaticFileHandler, {"path": "/app/tweetsentimentmap/js/"}),
        (r"/css/(.*)", tornado.web.StaticFileHandler, {"path": "/app/tweetsentimentmap/css/"})
    ])


# At the beginning of the program, connect to the DB and run the application
if __name__ == "__main__":
    connect_db()
    app = make_app()
    http_server = tornado.httpserver.HTTPServer(app)
    port = int(os.environ.get("PORT", 5000))
    http_server.listen(port)
    print('running')
    # starts the web-server
    tornado.ioloop.IOLoop.current().start()
