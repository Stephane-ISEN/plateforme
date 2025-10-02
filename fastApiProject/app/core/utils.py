import json
import os

ROLES_FILEPATH = os.path.join('app', 'core', 'auth_roles.json')


def load_roles(filepath: str) -> list:
    """
    Charge les rôles à partir d'un fichier JSON.

    Args:
        filepath (str): Le chemin du fichier JSON contenant les rôles.

    Returns:
        list: La liste des rôles.
    """
    with open(filepath, 'r') as file:
        data = json.load(file)
        return data.get("roles", [])


def get_default_role(filepath: str) -> str:
    """
    Récupère le rôle par défaut à partir d'un fichier JSON.

    Args:
        filepath (str): Le chemin du fichier JSON contenant les rôles.

    Returns:
        str: Le rôle par défaut.
    """
    roles = load_roles(filepath)
    default_role = "Formé"
    if default_role not in roles:
        raise ValueError(f"Le rôle par défaut '{default_role}' n'est pas défini dans les rôles disponibles.")
    return default_role

