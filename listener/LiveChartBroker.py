import pika
import json


class LiveChartBroker:
    def __init__(self):
        self.connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
        self.channel = self.connection.channel()

    def publish_change(self, channel_info, delta_changes):
        self.channel.queue_declare(queue=channel_info)
        self.channel.basic_publish(exchange='', routing_key=channel_info, body=json.dumps(delta_changes))
        