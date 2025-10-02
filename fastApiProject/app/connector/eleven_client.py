import os
from dotenv import load_dotenv

# Import selon la doc Python SDK
from elevenlabs.client import ElevenLabs
from elevenlabs.conversational_ai.conversation import Conversation
from elevenlabs.conversational_ai.default_audio_interface import DefaultAudioInterface

load_dotenv()

class ElevenClient:
    def __init__(self):
        # Par convention ElevenLabs attend ELEVENLABS_API_KEY
        self.api_key = os.getenv("ELEVEN_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVEN_API_KEY is missing in environment")

        # Instancie une fois le client principal
        self.client = ElevenLabs(api_key=self.api_key)
        # Prépare l’interface audio par défaut
        self.audio_interface = DefaultAudioInterface()

    def get_conversation(self, agent_id: str) -> Conversation:
        """
        Retourne une Conversation prête à l’emploi pour l’agent `agent_id`.
        """
        conv = Conversation(
            # premier arg : client ElevenLabs
            self.client,
            # second arg : l’ID de l’agent
            agent_id,
            # si on fournit une clé, on suppose que l’agent est privé
            requires_auth=True,
            # interface audio par défaut (input/output système)
            audio_interface=self.audio_interface,
            # callback minimal pour afficher la réponse
            callback_agent_response=lambda resp: print(f"[ElevenLabs] Agent: {resp}")
        )
        return conv
