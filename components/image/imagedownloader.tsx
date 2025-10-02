"use client";

import React, { useState, useEffect } from "react";

interface ImageDownloaderProps {
    imageUrl: string; // L'URL de l'image webp à convertir
}

const ImageDownloader: React.FC<ImageDownloaderProps> = ({ imageUrl }) => {
    const [pngUrl, setPngUrl] = useState<string>("");

    useEffect(() => {
        // Créer un nouvel élément Image
        const img = new Image();
        img.crossOrigin = "anonymous"; // Nécessaire pour éviter les problèmes CORS
        img.src = imageUrl;

        img.onload = () => {
            // Créer un canvas
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            // Dessiner l'image webp sur le canvas
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(img, 0, 0);

                // Convertir le canvas en PNG
                const pngUrl = canvas.toDataURL("image/png");

                // Mettre à jour l'URL pour téléchargement
                setPngUrl(pngUrl);
            }
        };
    }, [imageUrl]);

    return (
        <div>
            {pngUrl && (
                <a href={pngUrl} download="image.png">
                    Télécharger en PNG
                </a>
            )}
        </div>
    );
};

export default ImageDownloader;
