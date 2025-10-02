import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import Image from "next/image";
import { Empty } from "@/components/format/empty";
import { ImageResponse } from "@/types";
import { FetchImagesProps } from "@/types";
import ImageDownloader from "@/components/image/imagedownloader";
import { Button } from "@/components/ui/button";

const FetchImages: React.FC<FetchImagesProps> = ({ refreshKey }) => {
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Track whether component is mounted
    const fetchImages = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/image/user-images/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          credentials: "same-origin"  // Include credentials for authentication
        });

        if (!response.ok) {
          throw new Error("Failed to fetch images");
        }

      const data: ImageResponse[] = await response.json();
      if (isMounted) {  // Only set state if the component is still mounted
        setImages(data);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

    fetchImages().then(r => r).catch((e) => setError(e.message));

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

  if (images.length === 0) {
    return <Empty label="No images found" />;
  }
// eslint-disable-next-line @next/next/no-img-element
  return (
    <div className="flex m-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
        {images.map((image) => (
          <Card key={image.image_url} className={"shadow-lg dark:text-black dark:bg-white"}>
            <CardHeader>
              <CardTitle className={'flex flex-col items-center'}>{image.prompt}</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={image.image_url}
                alt={image.prompt}
                width={500}
                height={500}
                className="rounded-lg"
                loading="lazy"
              />
            </CardContent>
            <CardFooter className={'flex flex-col items-center'}>
              <Button className={'w-full dark:bg-[#111827] dark:text-white'}>
                <ImageDownloader imageUrl={image.image_url} />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FetchImages;