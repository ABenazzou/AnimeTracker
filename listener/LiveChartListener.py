from requests_html import HTMLSession
from datetime import datetime
import threading
import time
from enum import Enum
import json
from dictdiffer import diff
import traceback


class LogLevel(Enum):
    INFO = "INFO"
    EXCEPTION = "EXCEPTION"


class AnimeStatus(Enum):
    AIRING = "Airing"
    COMPLETED = "Completed"
    

class LiveChartListener:
    ''''
    Gets Data Continuously from LiveChart.me
    '''

    def __init__(self, user, categories, broker):
        self.base_url = "https://www.livechart.me/users"
        self.log_file = f"LiveChart_Listener_Log_{self.get_timestamp()}.txt"
        self.url = f"{self.base_url}/{user}/library?layout=regular&page=1&sort=next_release_countdown&statuses[]={'&statuses[]='.join(categories)}&titles=romaji&username={user}"
        self.subscribed = False
        self.broker = broker
        self.animes_file = "./subscribed_animes.json"

    def get_timestamp(self):
        return datetime.now().strftime("%d-%m-%Y_%H-%M-%S")


    def write_to_log(self, level, message):
        with open(f"./logs/{self.log_file}", 'a+') as log_file:
            log_file.write(f"[{self.get_timestamp()}][{level.value}]: {message}\n")


    
    def get_animes_information(self, livechart_response):
        '''
        Parses {Anime Name, Thumbnail, Total Episodes, Current Episode, Current Watched Episode, Rating, Status}.
        '''        
        result_cards = []
        anime_cards = livechart_response.html.xpath("//div[contains(@class, 'grid') and contains(@class, 'lc-small-anime-card-content-grid')]")        
        if type(anime_cards) != list:
            anime_cards = [anime_cards]
        
        if len(anime_cards) == 0:
            # check for possible captcha -> skip page this time
            if (livechart_response.html.xpath("//title")[0].text != "BENAZZOU_Adnane's Anime List | LiveChart.me"):
                self.write_to_log(LogLevel.EXCEPTION, "Polled 0 card due to captcha or loading page")
                return [False, []]
                
        self.write_to_log(LogLevel.INFO, f"Polled {len(anime_cards)} Animes")
        for anime_card in anime_cards:
            card_divs = anime_card.xpath("div/div")
            
            if len(card_divs) != 3:
                self.write_to_log(LogLevel.EXCEPTION, "Found Anime card without 3 elements exactly")
                continue
                            
            thumbnail_card = card_divs[0]
            thumbnail = thumbnail_card.xpath("div/img/@src")[0]    
            try:            
                rating = float(thumbnail_card.xpath("div/div")[0].text)
            except Exception as e:
                rating = "N/A"
            
            details_card = card_divs[1]
            name = details_card.xpath("div/div[@class='line-clamp-2']/a")[0].text
            
            try:
                current_episode = int(details_card.xpath("div/a/div/span")[0].text.replace("EP", "")) - 1
                status = AnimeStatus.AIRING
                
            except Exception as e:
                current_episode = "N/A"
                status = AnimeStatus.COMPLETED
                
            progress_card = card_divs[2]
            current_watched_episode = int(progress_card.xpath('//span[@data-user-library-anime-target="episodeProgress"]')[0].text)        
            total_episodes = progress_card.xpath('//span[@class="text-base-content/50"]')[0].text.replace("/", "").strip()
            
            if total_episodes == "–":
                total_episodes = "N/A"
            else:
                total_episodes = int(total_episodes)
            
            anime_card_summary = {"name": name,
                                "thumbnail": thumbnail,
                                "total episodes": total_episodes, 
                                "Current Episode": current_episode,
                                "Current Watched Episode": current_watched_episode,
                                "Rating": rating,
                                "Status": status.value
                                }
            result_cards.append(anime_card_summary)
            
        return([True, result_cards])
        
    
    def get_delta_changes(self, current_information, updated_information):
        '''
        Compares 2 dictionnaries and return wether they are changed or not + the difference as a dict
        '''
        results = list(diff(current_information, updated_information))
        delta = {"UPSERT": [], "REMOVE": []}
        for result in results:
            if result[0] == "add":
                for update in result[2]:
                    delta["UPSERT"].append(updated_information[update[0]])
            elif result[0] == "change":
                delta["UPSERT"].append(updated_information[result[1][0]])
            elif result[0] == "remove":
                for removal in result[2]:
                    delta["REMOVE"].append(current_information[removal[0]])
            
        return [len(results) != 0, delta]
    
    
    def unsubscribe(self):
        self.subscribed = False
        time.sleep(1)
        self.write_to_log(LogLevel.INFO, f"UNSUBSCRIBED LIVE CHART LISTENER FOR {self.url}")


    def subscribe(self):
        self.subscribed = True
        self.write_to_log(LogLevel.INFO, f"SUBSCRIBED LIVE CHART LISTENER FOR {self.url}")
        def subscription_thread():
            session = HTMLSession()
            
            while self.subscribed:
                try:
                    time.sleep(1)
                    response = session.get(self.url)
                    with open(self.animes_file, 'r') as f:
                        animes = json.load(f)
                        
                    self.write_to_log(LogLevel.INFO, "Loaded Animes JSON File")
                    
                    # scrape the list and compare to json
                    is_success_fetch, updated_animes_information = self.get_animes_information(response)
                    if not is_success_fetch:    continue
                    
                    is_changed_status, delta_changes = self.get_delta_changes(animes, updated_animes_information)
                    
                    if not is_changed_status:
                        self.write_to_log(LogLevel.INFO, "No Updates since last fetch")
                        continue
                    
                    # changed status, save to file and send the delta to the broker
                    with open(self.animes_file, "w") as f:
                        f.write(str(updated_animes_information).replace("'", '"'))
                        
                    self.write_to_log(LogLevel.INFO, "Updated Animes JSON File")
                    
                    self.broker.publish_change("delta_channel", delta_changes)
                    self.write_to_log(LogLevel.INFO, "Producer Sent Delta Changes to the delta_channel")

                except Exception:
                    self.write_to_log(LogLevel.EXCEPTION, str(traceback.format_exc()))

        subscription_thread = threading.Thread(target=subscription_thread)
        subscription_thread.start()

