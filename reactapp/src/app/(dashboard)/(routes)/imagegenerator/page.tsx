"use client";

import { Heading } from "@/components/format/heading";
import { Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import withAuth from "@/src/hocs/withauth";
import Navbar from "@/components/navbar/navbar";
import FetchImages from "@/components/image/fetchimages";
import { Card } from "@/components/ui/Card";

const ImageGeneratorPage = () => {
    const [userInput, setUserInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const form = useForm();

    const generateImage = async (prompt: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/image/generate-image/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ prompt }),
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Failed to generate image");
            }

            const data = await response.json();
            return data.image_url;
        } catch (error) {
            console.error("Error generating image:", error);
            setStatus("Failed to generate image");
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setStatus("Generating image...");

        const generatedImageUrl = await generateImage(userInput);

        if (generatedImageUrl) {
            setStatus("");
            setRefreshKey(prevKey => prevKey + 1);  // Update refreshKey to trigger FetchImages re-fetch
        } else {
            setStatus("Failed to generate image");
        }

        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <Heading
                title={"Image Generator"}
                description={
                <>
                    Générer des images à partir de texte (lien disponible 1h) ! image produite par le model{" "}
                    <a href="https://replicate.com/black-forest-labs/flux-schnell" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                        Flux1
                    </a>
                </>
                  }
                icon={Camera}
                iconColor={"text-blue-500"}
                bgColor={"bg-blue-500/10"}
            />

            <div className="flex flex-col flex-grow p-4 border-0 lg:p-8 ">
                <Card className="flex-grow overflow-y-auto dark:border-0 border-white p-2 mb-4">
                    <FetchImages refreshKey={refreshKey} />  {/* Pass refreshKey to FetchImages */}
                </Card>
                <div className=" pt-2 mt-2">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className={"rounded-lg w-full p-2 m-2 grid grid-cols-12 gap-2 bg-gray-300 dark:bg-gray-300"}
                        >
                            <FormField
                                name={"prompt"}
                                render={({ field }) => (
                                    <FormItem className={"col-span-12 lg:col-span-10"}>
                                        <FormControl className={"m-0 p-0"}>
                                            <Input
                                                className="text-sm text-black p-2 border-0 bg-gray-300 dark:bg-gray-300 dark:border font-semibold rounded-lg w-full relative"
                                                disabled={isLoading}
                                                placeholder={"insérer ici le prompt de l'image que vous souhaitez générer ?"}
                                                {...field}
                                                onChange={(e) => setUserInput(e.target.value)}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="col-span-12 dark:bg-black lg:col-span-2 w-full" disabled={isLoading}>
                                Generate
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default withAuth(ImageGeneratorPage);
