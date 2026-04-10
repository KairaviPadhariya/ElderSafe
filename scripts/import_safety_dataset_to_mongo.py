from __future__ import annotations

import argparse
from pathlib import Path
import sys
import asyncio


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.ml_safety.data_sources import import_local_dataset_to_mongo


async def async_main(csv_path: str, collection_name: str, replace: bool) -> None:
    result = await import_local_dataset_to_mongo(path=csv_path, collection_name=collection_name, replace=replace)
    print(result)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import the uploaded senior safety CSV into MongoDB Atlas.")
    parser.add_argument("--csv-path", type=str, default="senior_citizen_safety_dataset.csv")
    parser.add_argument("--collection-name", type=str, default="senior_safety_dataset")
    parser.add_argument("--append", action="store_true", help="Append instead of replacing the collection.")
    args = parser.parse_args()

    asyncio.run(async_main(args.csv_path, args.collection_name, replace=not args.append))


if __name__ == "__main__":
    main()
