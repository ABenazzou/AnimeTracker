import { useEffect, useState } from "react";
import io from "socket.io-client";
import Card from "./components/Card";
import ratingIcon from "./assets/rating.png";
import { socketUrl } from "./constants";

const socket = io.connect(socketUrl);

function App() {
  const [messageReceived, setMessageReceived] = useState({
    Airing: [],
    Completed: [],
  });

  const [isAiringCollapsed, setIsAiringCollapsed] = useState(false);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false);

  useEffect(() => {
    socket.on("receive-anime-updates", (data) => {
      setMessageReceived(data);
    });
  }, [socket]);

  useEffect(() => {
    socket.emit("get-animes-list", "");
  }, []);

  const toggleAiringCollapse = () => {
    setIsAiringCollapsed(!isAiringCollapsed);
  };

  const toggleCompletedCollapse = () => {
    setIsCompletedCollapsed(!isCompletedCollapsed);
  };

  return (
    <div className="mx-12 my-2">
      <div className="mb-5">
        <h1
          className="mb-5 flex cursor-pointer justify-between rounded-md border border-gray-400 p-3 text-center text-3xl font-bold text-gray-400 shadow-lg  transition-all duration-300 ease-in-out"
          onClick={toggleAiringCollapse}
        >
          <span>Unwatched Episodes on Airing Animes</span>
          <span>
            {isAiringCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            )}
          </span>
        </h1>

        {!isAiringCollapsed && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {messageReceived.Airing.map((anime) => (
              <Card
                key={anime.id}
                animeImage={anime.thumbnail}
                totalEpisodes={anime.total_episodes}
                animeName={anime.name}
                ratingImage={ratingIcon}
                missingEpisodes={`${anime.current_watched_episode + 1} - ${
                  anime.current_episode
                }`}
                rating={anime.rating}
              ></Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1
          className="mb-5 flex cursor-pointer justify-between rounded-md border border-gray-400 p-3 text-center text-3xl font-bold text-gray-400 shadow-lg"
          onClick={toggleCompletedCollapse}
        >
          <span>Unwatched Episodes on Completed Animes</span>
          <span>
            {isCompletedCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            )}
          </span>
        </h1>

        {!isCompletedCollapsed && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {messageReceived.Completed.map((anime) => (
              <div key={anime.id}>
                <Card
                  animeImage={anime.thumbnail}
                  totalEpisodes={anime.total_episodes}
                  animeName={anime.name}
                  ratingImage={ratingIcon}
                  missingEpisodes={`${anime.current_watched_episode + 1} - ${
                    anime.current_episode
                  }`}
                  rating={anime.rating}
                ></Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
