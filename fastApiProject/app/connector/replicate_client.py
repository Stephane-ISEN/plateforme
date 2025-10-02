import os

import replicate
from dotenv import load_dotenv


load_dotenv()


class ReplicateClient:
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        if not self.api_token:
            raise ValueError("API token is missing. Check your environment variables.")

        replicate.Client(api_token=self.api_token)

    async def generate_image(self, prompt: str) -> str:
        """
        Génère une image à partir d'un texte donné en utilisant l'API Replicate.

        Args:
            prompt (str): Le texte descriptif pour générer l'image.

        Returns:
            str: L'URL de l'image générée.

        Raises:
            ValueError: Si le prompt est vide.
            Exception: Si aucune sortie n'est reçue du modèle ou en cas d'erreur lors de la génération de l'image.
        """
        if not prompt:
            raise ValueError("Prompt must not be empty.")

        try:
            # Appel à l'API Replicate pour générer l'image
            output = await replicate.async_run(
                "black-forest-labs/flux-schnell",
                input={"prompt": prompt}
            )

            if output:
                return output[0]
            else:
                raise Exception("No output received from the model.")
        except Exception as e:
            raise Exception(f"Failed to generate image: {e}")

    async def generate_video(self, prompt: str) -> str:
        """
        Génère une vidéo à partir d'un prompt donné en utilisant l'API Replicate.

        Args:
            prompt (str): Le texte descriptif pour générer la vidéo.

        Returns:
            str: L'URL ou le chemin de la vidéo générée.

        Raises:
            ValueError: Si le prompt est vide.
            Exception: Si une erreur survient lors de l'appel à l'API ou si aucune sortie n'est reçue.
        """
        if not prompt:
            raise ValueError("Prompt must not be empty.")

        try:
            # Appel à l'API Replicate pour générer l'image
            output = await replicate.async_run(
                "lucataco/animate-diff:beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f",
                input={"prompt": prompt}
            )

            if output:
                return output
            else:
                raise Exception("No output received from the model.")
        except Exception as e:
            raise Exception(f"Failed to generate video: {e}")
