import psycopg2
from config import DB_INFO


try:
    connection = psycopg2.connect(user=DB_INFO['user'],
                                  password=DB_INFO['password'],
                                  host=DB_INFO['host'],
                                  port=DB_INFO['port'],
                                  database=DB_INFO['database']
                                  )
    connection.autocommit = True
    cursor = connection.cursor()

    resp = cursor.execute('Select * from tweets where sentiment>0;')
    tweets = cursor.fetchall()
    for tweet in tweets:
        print(tweet)

except (Exception, psycopg2.Error) as error:
    print("Error while connecting", error)

finally:
    if connection:
        cursor.close()
        connection.close()
        print("PSQL conn is closed")
