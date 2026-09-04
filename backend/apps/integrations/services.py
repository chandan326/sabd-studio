"""External service adapters with safe, optional fallbacks."""

import logging
from functools import lru_cache

from django.conf import settings

logger = logging.getLogger(__name__)


class MongoService:
    """Auxiliary document store for provider events and AI payload snapshots.

    Django's relational database remains the system of record. This keeps auth,
    permissions, and migrations reliable while MongoDB stores flexible events.
    """

    @staticmethod
    @lru_cache(maxsize=1)
    def database():
        if not settings.MONGODB_URI:
            return None
        from pymongo import MongoClient

        client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            appname="sabd-studio",
        )
        client.admin.command("ping")
        return client[settings.MONGODB_DATABASE]

    @classmethod
    def record_event(cls, collection, payload):
        try:
            database = cls.database()
            if database is None:
                return None
            return str(database[collection].insert_one(payload).inserted_id)
        except Exception as exc:
            logger.warning("MongoDB event write skipped: %s", exc)
            return None


class CloudinaryStorageService:
    @staticmethod
    def configured():
        return all((settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET))

    @classmethod
    def upload(cls, uploaded_file, campaign_id):
        if not cls.configured():
            return None
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        uploaded_file.seek(0)
        result = cloudinary.uploader.upload(
            uploaded_file,
            folder=f"{settings.CLOUDINARY_FOLDER}/campaigns/{campaign_id}",
            resource_type="auto",
            use_filename=True,
            unique_filename=True,
            overwrite=False,
        )
        uploaded_file.seek(0)
        return {
            "storage_key": result.get("public_id", ""),
            "secure_url": result.get("secure_url", ""),
            "resource_type": result.get("resource_type", "raw"),
        }
