import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import Image from "next/image";
import { Empty } from "@/components/format/empty";
import { VideoResponse } from "@/types";
import { FetchVideosProps } from "@/types";
import ImageDownloader from "@/components/image/imagedownloader";
import { Button } from "@/components/ui/button";

const FetchVideos: React.FC<FetchVideosProps> = ({ refreshKey }) => {
  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Track whether component is mounted
    const fetchVideos = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/video/user-videos/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          credentials: "same-origin"  // Include credentials for authentication
        });

        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }

      const data: VideoResponse[] = await response.json();
      if (isMounted) {  // Only set state if the component is still mounted
        setVideos(data);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

    fetchVideos().then(r => r).catch((e) => setError(e.message));

  return () => {
    isMounted = false; // Cleanup when component unmounts
  };
}, [refreshKey]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (videos.length === 0) {
    return <Empty label="No videos found" />;
  }
// eslint-disable-next-line @next/next/no-img-element
  return (
    <div className="flex m-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.video_url} className={"shadow-lg dark:text-black dark:bg-white"}>
            <CardHeader>
              <CardTitle className={'flex flex-col items-center'}>{video.prompt}</CardTitle>
            </CardHeader>
            <CardContent>
              <video
                src={video.video_url}
                controls
                width="500"
                height="500"
                className="rounded-lg"
              />
            </CardContent>
            <CardFooter/>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FetchVideos;