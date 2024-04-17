from LiveChartListener import LiveChartListener
from LiveChartBroker import LiveChartBroker
import time


if __name__ == "__main__":
    broker = LiveChartBroker()
    listener = LiveChartListener(user="BENAZZOU_Adnane", categories=["watching", "planning", "considering", "paused"], broker=broker)
    listener.subscribe()
    time.sleep(100)
    listener.unsubscribe()

