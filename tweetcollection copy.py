import re
import tweepy
from tweepy import OAuthHandler
from textblob import TextBlob
import psycopg2
import json
from apscheduler.schedulers.blocking import BlockingScheduler


class TwitterClient(object):
    '''
    Generic Twitter Class for sentiment analysis.
    Adapted from https://www.geeksforgeeks.org/twitter-sentiment-analysis-using-python/
    '''

    def __init__(self):
        '''
        Class constructor. Initializes the TwitterAPI client to call get requests
        and receive tweets from Twitter.
        '''
        # keys and tokens from the Twitter Dev Console
        consumer_key = '***'
        consumer_secret = '***'
        access_token = '***'
        access_token_secret = '***'

        # attempt authentication
        try:
            # create OAuthHandler object
            self.auth = OAuthHandler(consumer_key, consumer_secret)
            # set access token and secret
            self.auth.set_access_token(access_token, access_token_secret)
            # create tweepy API object to fetch tweets
            self.api = tweepy.API(self.auth)
        except:
            print("Error: Authentication Failed")

    def clean_tweet(self, tweet):
        '''
        Utility function to clean tweet text by removing links, special characters
        using simple regex statements.
        '''
        return ' '.join(re.sub("(@[A-Za-z0-9]+)|([^0-9A-Za-z \t]) | (\w+:\ / \ / \S+)", " ", tweet).split())

    def get_tweet_sentiment(self, tweet):
        '''
        Utility function to classify sentiment of passed tweet
        using textblob's sentiment method
        '''
        # create TextBlob object of passed tweet text
        analysis = TextBlob(self.clean_tweet(tweet))
        # set sentiment
        return analysis.sentiment.polarity

    def get_tweets(self, query, cursor):
        '''
        Main function to fetch tweets and parse them.
        '''
        try:
            # call twitter api to fetch tweets
            fetched_tweets = self.api.search(q=query, count=100)
            # parsing tweets one by one and uploading them to the database
            for tweet in fetched_tweets:
                try:
                    # inserting each tweet into the DB, specifying the columns necessary to input.
                    cursor.execute('''
                    Insert into tweets(id,date_created,sentiment,place) values (%s, %s, %s, %s)
                    on conflict do nothing
                    ''', (tweet.id, tweet.created_at.date(), self.get_tweet_sentiment(tweet.text), json.dumps(tweet._json['place'])))
                except (Exception, psycopg2.Error) as e: # catching an error if fail to connect to DB
                    print("Error while connecting:", e)

            return 0

        except tweepy.TweepError as e:
            # print error if can't connect to twitter (if any)
            print("Error : " + str(e))


def main():
    '''
    Main funciton to connect to the database and run the tweepy query to fetch
    Corona-related tweets and insert into DB
    '''
    try:  # trying to connect to the database
        connection = psycopg2.connect(user="***",
                                      password="***",
                                      host="***",
                                      port="***",
                                      database="***")
        connection.autocommit = True  # turning on autocommit so that each insert automatically commits the insert.
        cursor = connection.cursor()

        # creating object of TwitterClient Class
        api = TwitterClient()
        # calling function to get tweets
        for i in range(150):
            print("round ", i)
            api.get_tweets(query='corona', cursor=cursor)

    except (Exception, psycopg2.Error) as error:
        print("Error while connecting", error)

    # close the connection to the DB to prevent leaks.
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("PSQL conn is closed")


if __name__ == "__main__":
    # A scheduling blocker object to allow timed runs of the program.
    sched = BlockingScheduler()
    # function that runs the main() program once a day at 6am
    @sched.scheduled_job('cron', day_of_week='mon-sun', hour=6)
    def scheduled_job():
        main()
    # starting the scheduled runs
    sched.start()
