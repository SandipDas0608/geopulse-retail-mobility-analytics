from fastapi import APIRouter, HTTPException, Query
import os
import sys

REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from services.snowflake_service import (
    test_snowflake_connection,
    get_snowflake_mobility_points,
    get_snowflake_stores,
    get_snowflake_hourly_footfall,
    get_snowflake_cannibalization,
    get_backup_stores,
    get_backup_cannibalization,
    get_backup_hourly_footfall,
)


from src.analytics.footfall_metrics import (
    aggregate_daily_visitors,
    find_cannibalization_pairs,
)

router = APIRouter(
    prefix="/snowflake",
    tags=["Snowflake"]
)


@router.get("/health")
def snowflake_health():
    try:
        connection_info = test_snowflake_connection()

        return {
            "status": "success",
            "snowflake": connection_info
        }

    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Snowflake connection unavailable: {str(error)}"
        )


@router.get("/mobility-points")
def snowflake_mobility_points(limit: int = 1000):
    try:
        points = get_snowflake_mobility_points(limit)

        return {
            "status": "success",
            "source": "snowflake",
            "count": len(points),
            "points": points,
        }

    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Snowflake mobility data unavailable: {str(error)}"
        )


@router.get("/stores")
def snowflake_stores(limit: int = Query(default=100, ge=1, le=1000)):
    try:
        stores = get_snowflake_stores(limit)
        source = "snowflake"

    except Exception:
        stores = get_backup_stores(limit)
        source = "backup_csv"

    return {
        "status": "success",
        "source": source,
        "count": len(stores),
        "stores": stores,
    }


@router.get("/cannibalization")
def snowflake_cannibalization():
    try:
        pairs = get_snowflake_cannibalization()
        source = "snowflake"

    except Exception:
        try:
            pairs = get_backup_cannibalization()
            source = "backup_csv"

        except Exception:
            raise HTTPException(
                status_code=503,
                detail="Snowflake and CSV backup cannibalization data unavailable",
            )

    return {
        "status": "success",
        "source": source,
        "count": len(pairs),
        "pairs": pairs,
    }

@router.get("/hourly-footfall")
def snowflake_hourly_footfall(
    limit: int = Query(default=24, ge=1, le=100)
):
    try:
        data = get_snowflake_hourly_footfall(limit)
        source = "snowflake"

    except Exception:
        try:
            data = get_backup_hourly_footfall(limit)
            source = "backup_csv"

        except Exception:
            raise HTTPException(
                status_code=503,
                detail="Snowflake and CSV backup hourly footfall data unavailable",
            )

    return {
        "status": "success",
        "source": source,
        "count": len(data),
        "data": data,
    }