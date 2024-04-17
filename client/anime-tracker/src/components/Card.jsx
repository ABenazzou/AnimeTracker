function Card({
  animeImage,
  totalEpisodes,
  animeName,
  ratingImage,
  missingEpisodes,
  rating,
}) {
  return (
    <div className="w-full max-w-sm text-white lg:flex lg:max-w-full">
      <div
        className="h-48 flex-none overflow-hidden rounded-t bg-cover text-center lg:h-60 lg:w-5/12 lg:rounded-l lg:rounded-t-none"
        style={{
          backgroundImage: `url(${animeImage})`,
        }}
        title={animeName}
      ></div>

      <div className="flex flex-col justify-between rounded-b border-b border-l border-r border-gray-700 bg-gray-800 p-4 leading-normal lg:rounded-b-none lg:rounded-r lg:border-l-0 lg:border-t lg:border-gray-700">
        <div className="mb-3">
          <p className="flex items-center text-sm text-gray-400">
            <svg
              className="mr-2 h-3 w-3 fill-current text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M4 8V6a6 6 0 1 1 12 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2h1zm5 6.73V17h2v-2.27a2 2 0 1 0-2 0zM7 6v2h6V6a3 3 0 0 0-6 0z" />
            </svg>
            Total Episodes: {totalEpisodes}
          </p>
          <div className="line-clamp-2 h-14 break-all text-xl font-bold">
            {animeName}
          </div>
        </div>
        <div className="flex items-center">
          <img
            className="mr-4 h-10 w-10 rounded"
            src={ratingImage}
            alt="Average Rating"
          />
          <div className="text-sm">
            <p className="break-all leading-none text-gray-100">
              Missing Episodes: {missingEpisodes}
            </p>
            <p className="text-gray-400">Rating: {rating}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card;
