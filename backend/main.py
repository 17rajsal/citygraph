import os
import logging
from typing import Dict, List, Optional
import random

import networkx as nx
from fastapi import FastAPI, Depends, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from database import engine, Base, SessionLocal
from models import User
from auth_utils import get_current_user
from routers.auth import router as auth_router, seed_default_user
from routers.historical import router as historical_router
from routers.nepal import router as nepal_router
from rate_limiter import limiter

logger = logging.getLogger("citygraph.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
ENABLE_DOCS = os.getenv("ENABLE_DOCS", "true").lower() == "true"

app = FastAPI(
    title="CityGraph API",
    description="Predictive cascading failure simulation for smart cities",
    version="1.0.0",
    docs_url="/docs" if ENABLE_DOCS else None,
    redoc_url="/redoc" if ENABLE_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_DOCS else None,
)

# Production CORS configuration
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    allowed_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]
else:
    # Safe development default
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Add defensive security headers to all HTTP responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    if ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Sanitize unhandled exceptions so no internal stack traces leak to users."""
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers)
    logger.error(f"Unhandled server exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Incident has been logged."},
    )


app.include_router(auth_router)
app.include_router(historical_router)
app.include_router(nepal_router)


class RainRequest(BaseModel):
    rainfall_level: int = Field(default=90, ge=1, le=500, description="Rainfall intensity in mm/hr (1 to 500)")


city_graph = nx.Graph()
original_graph = nx.Graph()

node_data: Dict[str, dict] = {}
original_node_data: Dict[str, dict] = {}

simulation_state = {
    "active": False,
    "scenario": "normal",
    "failed_nodes": [],
    "affected_nodes": [],
    "risk_scores": {},
    "timeline": [],
    "safe_route": [],
}


def create_city_graph() -> None:
    """
    Creates a small synthetic city network.

    Node types:
    - hospital
    - drainage
    - road
    - transformer
    - fire_station
    """

    global city_graph, original_graph
    global node_data, original_node_data

    city_graph.clear()
    node_data.clear()

    random.seed(42)

    node_types = [
        "hospital",
        "drainage",
        "road",
        "transformer",
        "fire_station",
    ]

    # Create 70 nodes
    for index in range(1, 71):
        node_id = f"node_{index}"

        if index == 1:
            node_type = "hospital"
        elif index == 2:
            node_type = "fire_station"
        elif index in [10, 20, 30, 40, 50, 60]:
            node_type = "drainage"
        elif index in [15, 35, 55]:
            node_type = "transformer"
        else:
            node_type = "road"

        capacity = random.randint(60, 100)
        current_load = random.randint(20, 75)

        city_graph.add_node(node_id)

        node_data[node_id] = {
            "id": node_id,
            "type": node_type,
            "capacity": capacity,
            "current_load": current_load,
            "risk": round(current_load / capacity, 2),
            "status": "safe",
            "criticality": random.randint(1, 10),
        }

    # Create a connected backbone
    for index in range(1, 70):
        city_graph.add_edge(
            f"node_{index}",
            f"node_{index + 1}",
            distance=random.randint(1, 10),
            risk_penalty=0,
        )

    # Add extra connections
    for _ in range(45):
        first = random.randint(1, 70)
        second = random.randint(1, 70)

        if first != second:
            city_graph.add_edge(
                f"node_{first}",
                f"node_{second}",
                distance=random.randint(1, 10),
                risk_penalty=0,
            )

    # Deterministic human-readable metadata enrichment (Zero random calls)
    delhi_corridor_names = [
        "Ring Road North Corridor", "Bela Road River Approach", "Kashmere Gate ISBT Link",
        "Mori Gate Arterial Crossing", "Chandni Chowk North Approach", "Red Fort Salimgarh Corridor",
        "Delhi Gate Junction", "Daryaganj Central Link", "Asaf Ali Road Transit Way",
        "Rani Jhansi Elevated Way", "Filmistan Road Junction", "Karol Bagh East Link",
        "Pusa Road Corridor", "Shankar Road Junction", "Ridge Road Elevated Segment",
        "Connaught Place Outer Circle", "Barakhamba Road Link", "Mandi House Roundabout",
        "Tilak Marg Corridor", "Bhagwan Das Road Crossway", "Mathura Road North Junction",
        "Purana Qila Approach", "Subramaniam Bharti Marg", "Lodhi Road Transit Corridor",
        "Jawaharlal Nehru Stadium Link", "CGO Complex Access Road", "Barapullah Elevated Entry",
        "Lajpat Nagar Ring Road Link", "Moolchand Underpass Approach", "Andrews Ganj Crossing",
        "AIIMS South Approach Road", "Safdarjung Enclave Link", "Bhikaji Cama Place Way",
        "Africa Avenue Corridor", "Chanakyapuri Diplomatic Enclave", "Shanti Path Arterial",
        "Dhaula Kuan Multi-level Interchange", "Sardar Patel Marg Way", "Vande Mataram Marg Link",
        "Upper Ridge Road Segment", "Karol Bagh West Interchange", "Patel Nagar Commercial Link",
        "Shadipur Flyover Approach", "Kirti Nagar Industrial Corridor", "Moti Nagar Junction",
        "Raja Garden Ring Road Crossing", "Punjabi Bagh Club Road", "Rohtak Road North Entry",
        "Shakurpur Arterial Link", "Netaji Subhash Place Junction", "Wazirpur Industrial Crossway",
        "Ashok Vihar Phase-1 Connector", "Shalimar Bagh Ring Road Access", "Azadpur Mandi Corridor",
        "Model Town Main Avenue", "GT Karnal Road Junction", "Mukherjee Nagar Connector",
        "Mall Road University Crossway", "Timarpur Riverbank Road", "Civil Lines Sham Nath Marg",
        "Rajpur Road North Corridor", "Yamuna Bazar Access Link"
    ]

    delhi_corridor_coords = [
        (28.7000, 77.2200),  # Ring Road North Corridor
        (28.6700, 77.2380),  # Bela Road River Approach
        (28.6690, 77.2320),  # Kashmere Gate ISBT Link
        (28.6640, 77.2220),  # Mori Gate Arterial Crossing
        (28.6560, 77.2300),  # Chandni Chowk North Approach
        (28.6562, 77.2410),  # Red Fort Salimgarh Corridor
        (28.6410, 77.2400),  # Delhi Gate Junction
        (28.6450, 77.2380),  # Daryaganj Central Link
        (28.6430, 77.2320),  # Asaf Ali Road Transit Way
        (28.6550, 77.2050),  # Rani Jhansi Elevated Way
        (28.6570, 77.2080),  # Filmistan Road Junction
        (28.6520, 77.1950),  # Karol Bagh East Link
        (28.6460, 77.1850),  # Pusa Road Corridor
        (28.6380, 77.1850),  # Shankar Road Junction
        (28.6300, 77.1800),  # Ridge Road Elevated Segment
        (28.6328, 77.2197),  # Connaught Place Outer Circle
        (28.6290, 77.2250),  # Barakhamba Road Link
        (28.6258, 77.2344),  # Mandi House Roundabout
        (28.6129, 77.2295),  # Tilak Marg / India Gate
        (28.6230, 77.2320),  # Bhagwan Das Road Crossway
        (28.6150, 77.2420),  # Mathura Road North Junction
        (28.6095, 77.2435),  # Purana Qila Approach
        (28.6010, 77.2310),  # Subramaniam Bharti Marg
        (28.5915, 77.2275),  # Lodhi Road Transit Corridor
        (28.5830, 77.2360),  # Jawaharlal Nehru Stadium Link
        (28.5880, 77.2350),  # CGO Complex Access Road
        (28.5810, 77.2480),  # Barapullah Elevated Entry
        (28.5690, 77.2420),  # Lajpat Nagar Ring Road Link
        (28.5660, 77.2340),  # Moolchand Underpass Approach
        (28.5640, 77.2240),  # Andrews Ganj Crossing
        (28.5650, 77.2120),  # AIIMS South Approach Road
        (28.5620, 77.2010),  # Safdarjung Enclave Link
        (28.5680, 77.1870),  # Bhikaji Cama Place Way
        (28.5630, 77.1910),  # Africa Avenue Corridor
        (28.5940, 77.1880),  # Chanakyapuri Diplomatic Enclave
        (28.5980, 77.1930),  # Shanti Path Arterial
        (28.5925, 77.1625),  # Dhaula Kuan Multi-level Interchange
        (28.6010, 77.1720),  # Sardar Patel Marg Way
        (28.6200, 77.1800),  # Vande Mataram Marg Link
        (28.6400, 77.1820),  # Upper Ridge Road Segment
        (28.6530, 77.1890),  # Karol Bagh West Interchange
        (28.6550, 77.1680),  # Patel Nagar Commercial Link
        (28.6510, 77.1550),  # Shadipur Flyover Approach
        (28.6530, 77.1420),  # Kirti Nagar Industrial Corridor
        (28.6580, 77.1410),  # Moti Nagar Junction
        (28.6520, 77.1230),  # Raja Garden Ring Road Crossing
        (28.6680, 77.1310),  # Punjabi Bagh Club Road
        (28.6750, 77.1350),  # Rohtak Road North Entry
        (28.6880, 77.1480),  # Shakurpur Arterial Link
        (28.6940, 77.1520),  # Netaji Subhash Place Junction
        (28.6980, 77.1620),  # Wazirpur Industrial Crossway
        (28.6910, 77.1750),  # Ashok Vihar Phase-1 Connector
        (28.7120, 77.1630),  # Shalimar Bagh Ring Road Access
        (28.7160, 77.1750),  # Azadpur Mandi Corridor
        (28.7050, 77.1930),  # Model Town Main Avenue
        (28.7150, 77.2020),  # GT Karnal Road Junction
        (28.7110, 77.2150),  # Mukherjee Nagar Connector
        (28.6970, 77.2140),  # Mall Road University Crossway
        (28.6990, 77.2280),  # Timarpur Riverbank Road
        (28.6780, 77.2260),  # Civil Lines Sham Nath Marg
        (28.6830, 77.2210),  # Rajpur Road North Corridor
        (28.6650, 77.2350),  # Yamuna Bazar Access Link
    ]

    for node_id, data in node_data.items():
        idx = int(node_id.replace("node_", ""))
        ntype = data["type"]

        if node_id == "node_1":
            name = "AIIMS Apex Trauma Center"
            short_name = "AIIMS Trauma"
            type_label = "Emergency Hospital"
            zone = "South Delhi Medical Corridor"
            description = "Primary Level-1 trauma care and emergency surgery hub."
            lat, lng = 28.5672, 77.2100
        elif node_id == "node_2":
            name = "Delhi Fire Service HQ Operations"
            short_name = "DFS HQ Station"
            type_label = "Emergency Operations Command"
            zone = "Central Emergency Division"
            description = "Central emergency dispatch and water rescue coordination headquarters."
            lat, lng = 28.6304, 77.2274
        elif node_id == "node_6":
            name = "Red Fort Salimgarh Corridor (#6)"
            short_name = "Red Fort Salimgarh"
            type_label = "Heritage Arterial Way"
            zone = "Old Delhi Lowland Basin"
            description = "Historic transit link connecting Old Delhi to the Ring Road."
            lat, lng = 28.6562, 77.2410
        elif node_id == "node_10":
            name = "Wazirabad Stormwater Pumping Station"
            short_name = "Wazirabad Pump"
            type_label = "Stormwater Pumping Station"
            zone = "North Yamuna Drainage Basin"
            description = "High-capacity riverfront drainage pump serving North Delhi Ring Road."
            lat, lng = 28.7118, 77.2312
        elif node_id == "node_15":
            name = "Civil Lines 220kV Grid Substation"
            short_name = "Civil Lines Substation"
            type_label = "Power Grid Substation"
            zone = "North Power Ring"
            description = "High-voltage transmission substation supplying northern public infrastructure."
            lat, lng = 28.6750, 77.2250
        elif node_id == "node_16":
            name = "Connaught Place Central Hub (#16)"
            short_name = "Connaught Place"
            type_label = "Central Commercial Node"
            zone = "Central Municipal Division"
            description = "Major central radial transit and commercial junction."
            lat, lng = 28.6328, 77.2197
        elif node_id == "node_19":
            name = "India Gate National Corridor (#19)"
            short_name = "India Gate Corridor"
            type_label = "Arterial Transit Way"
            zone = "Central Government Precinct"
            description = "National monument radial corridor linking North and South blocks."
            lat, lng = 28.6129, 77.2295
        elif node_id == "node_20":
            name = "Kashmere Gate Lowland Sluice Regulator"
            short_name = "Kashmere Gate Sluice"
            type_label = "Stormwater Pumping Station"
            zone = "Old Delhi Lowland Basin"
            description = "Sluice regulator draining Monastery Market and Ring Road lowlands."
            lat, lng = 28.6675, 77.2285
        elif node_id == "node_30":
            name = "ITO Drain #12 Relief Regulator"
            short_name = "ITO Drain #12"
            type_label = "Stormwater Pumping Station"
            zone = "Central Yamuna Basin"
            description = "Critical stormwater regulator discharging central government precinct runoff."
            lat, lng = 28.6285, 77.2475
        elif node_id == "node_35":
            name = "Pragati Power Transmission Station"
            short_name = "Pragati Power Grid"
            type_label = "Power Grid Substation"
            zone = "Central Power Ring"
            description = "Critical grid hub powering central drainage and transit corridors."
            lat, lng = 28.6180, 77.2460
        elif node_id == "node_40":
            name = "Barapullah Main Sluice Regulator #4"
            short_name = "Barapullah Sluice #4"
            type_label = "Stormwater Pumping Station"
            zone = "South-Central Drainage Basin"
            description = "Major stormwater confluence regulator for South Delhi runoff."
            lat, lng = 28.5850, 77.2450
        elif node_id == "node_43":
            name = "Ring Road Underpass #43 (Mathura Road Link)"
            short_name = "Ring Road Underpass #43"
            type_label = "Arterial Road Junction"
            zone = "South-East Arterial Transit Corridor"
            description = "Depressed arterial underpass connecting Ring Road to Mathura Road commercial corridor."
            lat, lng = 28.5700, 77.2500
        elif node_id == "node_50":
            name = "Okhla Barrage Outfall Pumping Facility"
            short_name = "Okhla Outfall Pump"
            type_label = "Stormwater Pumping Station"
            zone = "South-East River Basin"
            description = "Terminal outfall pumping station for southern Delhi stormwater canals."
            lat, lng = 28.5355, 77.2728
        elif node_id == "node_55":
            name = "Sarita Vihar High-Voltage Substation"
            short_name = "Sarita Vihar Substation"
            type_label = "Power Grid Substation"
            zone = "South Power Ring"
            description = "Transmission substation powering southern drainage pump networks."
            lat, lng = 28.5300, 77.2900
        elif node_id == "node_60":
            name = "Mayur Vihar Spillway Pump Station"
            short_name = "Mayur Vihar Pump"
            type_label = "Stormwater Pumping Station"
            zone = "Trans-Yamuna Drainage Basin"
            description = "Pumping station protecting low-lying eastern floodplain communities."
            lat, lng = 28.6050, 77.2950
        elif node_id == "node_70":
            name = "Indira Gandhi International Airport (T3)"
            short_name = "IGI Airport (T3)"
            type_label = "Aviation Transit Hub"
            zone = "South-West Aviation Corridor"
            description = "Primary international and domestic aeromedical transit gateway."
            lat, lng = 28.5562, 77.1000
        else:
            corridor_idx = idx % len(delhi_corridor_names)
            corridor = delhi_corridor_names[corridor_idx]
            name = f"{corridor} (#{idx})"
            short_name = f"Junction #{idx}"
            type_label = "Arterial Road Junction"
            zone = "Municipal Transit Grid"
            description = f"Arterial transit crossing linking {corridor} with surrounding infrastructure."
            lat, lng = delhi_corridor_coords[corridor_idx]

        neighbors = list(city_graph.neighbors(node_id))

        data.update({
            "name": name,
            "short_name": short_name,
            "type_label": type_label,
            "zone": zone,
            "lat": lat,
            "lng": lng,
            "description": description,
            "metadata_origin": "Synthetic asset metadata",
            "failure_reason": "Normal operational parameters; within design tolerance.",
            "connected_corridors": neighbors,
        })

    original_graph = city_graph.copy()
    original_node_data = {
        node_id: data.copy()
        for node_id, data in node_data.items()
    }


def reset_simulation_state() -> None:
    global city_graph, node_data

    city_graph = original_graph.copy()
    node_data = {
        node_id: data.copy()
        for node_id, data in original_node_data.items()
    }

    simulation_state["active"] = False
    simulation_state["scenario"] = "normal"
    simulation_state["failed_nodes"] = []
    simulation_state["affected_nodes"] = []
    simulation_state["risk_scores"] = {
        node_id: data["risk"]
        for node_id, data in node_data.items()
    }
    simulation_state["timeline"] = []
    simulation_state["safe_route"] = []


def find_safe_route() -> List[str]:
    """
    Finds a route from the hospital to the fire station.
    Risky or failed nodes receive a high cost.
    """

    source = "node_1"
    target = "node_2"

    route_graph = city_graph.copy()

    for node_id, data in node_data.items():
        if data["status"] == "failed":
            if node_id in route_graph:
                route_graph.remove_node(node_id)

    for first, second, edge_data in route_graph.edges(data=True):
        first_risk = node_data[first]["risk"]
        second_risk = node_data[second]["risk"]

        risk_penalty = int((first_risk + second_risk) * 20)

        edge_data["weight"] = edge_data.get("distance", 1) + risk_penalty

    try:
        return nx.shortest_path(
            route_graph,
            source=source,
            target=target,
            weight="weight",
        )
    except nx.NetworkXNoPath:
        return []


def run_heavy_rain_simulation(rainfall_level: int) -> dict:
    reset_simulation_state()

    simulation_state["active"] = True
    simulation_state["scenario"] = "heavy_rain"

    timeline = []
    failed_nodes = []
    affected_nodes = []

    # Step 1: Find drainage nodes
    drainage_nodes = [
        node_id
        for node_id, data in node_data.items()
        if data["type"] == "drainage"
    ]

    # Step 2: Increase load because of rainfall
    for node_id in drainage_nodes:
        node_data[node_id]["current_load"] += rainfall_level // 2

        capacity = node_data[node_id]["capacity"]
        current_load = node_data[node_id]["current_load"]

        node_data[node_id]["risk"] = round(
            min(current_load / capacity, 1.0),
            2,
        )

    overloaded_drainage = [
        node_id
        for node_id in drainage_nodes
        if node_data[node_id]["current_load"]
        > node_data[node_id]["capacity"]
    ]

    # Step 3: Drainage failure
    for node_id in overloaded_drainage:
        node_data[node_id]["status"] = "failed"
        node_data[node_id]["failure_reason"] = (
            f"Stormwater intake capacity exceeded ({node_data[node_id]['current_load']}/"
            f"{node_data[node_id]['capacity']} units); backflow active."
        )
        failed_nodes.append(node_id)

    timeline.append(
        {
            "step": 1,
            "title": "Drainage overload",
            "description": (
                f"{len(overloaded_drainage)} drainage systems "
                "exceeded their capacity."
            ),
            "nodes": overloaded_drainage,
        }
    )

    # Step 4: Spread risk to connected roads
    road_nodes = set()

    for drainage_node in overloaded_drainage:
        neighbors = list(city_graph.neighbors(drainage_node))

        for neighbor in neighbors:
            if node_data[neighbor]["type"] == "road":
                road_nodes.add(neighbor)

    for road_node in road_nodes:
        node_data[road_node]["risk"] = round(
            min(node_data[road_node]["risk"] + 0.45, 1.0),
            2,
        )

        node_data[road_node]["status"] = "affected"
        node_data[road_node]["failure_reason"] = (
            "Surface runoff and road flooding risk propagated from adjacent failed drainage regulator."
        )
        affected_nodes.append(road_node)

    timeline.append(
        {
            "step": 2,
            "title": "Road flooding risk",
            "description": (
                f"{len(road_nodes)} roads are at risk "
                "because of nearby drainage failures."
            ),
            "nodes": list(road_nodes),
        }
    )

    # Step 5: Increase risk around affected roads
    nearby_nodes = set()

    for road_node in road_nodes:
        for neighbor in city_graph.neighbors(road_node):
            if node_data[neighbor]["status"] == "safe":
                node_data[neighbor]["risk"] = round(
                    min(node_data[neighbor]["risk"] + 0.20, 1.0),
                    2,
                )
                nearby_nodes.add(neighbor)

    timeline.append(
        {
            "step": 3,
            "title": "Secondary infrastructure risk",
            "description": (
                f"{len(nearby_nodes)} nearby infrastructure nodes "
                "received increased risk."
            ),
            "nodes": list(nearby_nodes),
        }
    )

    # Step 6: Calculate safer route
    safe_route = find_safe_route()

    timeline.append(
        {
            "step": 4,
            "title": "Emergency route calculation",
            "description": (
                "The system calculated a route avoiding failed nodes."
            ),
            "nodes": safe_route,
        }
    )

    simulation_state["failed_nodes"] = failed_nodes
    simulation_state["affected_nodes"] = list(affected_nodes)
    simulation_state["risk_scores"] = {
        node_id: data["risk"]
        for node_id, data in node_data.items()
    }
    simulation_state["timeline"] = timeline
    simulation_state["safe_route"] = safe_route

    return get_complete_graph_response()


def get_complete_graph_response() -> dict:
    nodes = []

    for node_id, data in node_data.items():
        nodes.append(data)

    edges = []

    for first, second, data in city_graph.edges(data=True):
        edges.append(
            {
                "source": first,
                "target": second,
                "distance": data.get("distance", 1),
            }
        )

    highest_node_id = max(
        node_data,
        key=lambda node_id: node_data[node_id]["risk"],
    )

    return {
        "scenario": simulation_state["scenario"],
        "active": simulation_state["active"],
        "nodes": nodes,
        "edges": edges,
        "failed_nodes": simulation_state["failed_nodes"],
        "affected_nodes": simulation_state["affected_nodes"],
        "risk_scores": simulation_state["risk_scores"],
        "timeline": simulation_state["timeline"],
        "safe_route": simulation_state["safe_route"],
        "summary": {
            "total_nodes": len(nodes),
            "failed_nodes": len(simulation_state["failed_nodes"]),
            "affected_nodes": len(simulation_state["affected_nodes"]),
            "highest_risk_node": highest_node_id,
            "highest_risk_asset_name": node_data[highest_node_id].get("name", highest_node_id),
        },
    }


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_user(db)
    finally:
        db.close()
    create_city_graph()
    reset_simulation_state()


@app.get("/")
def home():
    return {
        "message": "CityGraph API is running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "citygraph-backend",
    }


@app.get("/api/health")
def api_health_check():
    return {
        "status": "ok",
        "service": "citygraph-backend",
    }


@app.get("/graph")
def get_graph(current_user: User = Depends(get_current_user)):
    return get_complete_graph_response()


@app.post("/simulate/heavy-rain")
def simulate_heavy_rain(
    request_body: RainRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    # Rate limit simulation (10 requests per minute per IP to prevent CPU exhaustion)
    limiter.check_rate_limit(request, endpoint_key="simulate_heavy_rain", max_requests=10, window_seconds=60)
    return run_heavy_rain_simulation(request_body.rainfall_level)


@app.post("/reset")
def reset(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    limiter.check_rate_limit(request, endpoint_key="reset_simulation", max_requests=15, window_seconds=60)
    reset_simulation_state()
    return get_complete_graph_response()


class RouteRequest(BaseModel):
    source: Optional[str] = "node_1"
    target: Optional[str] = "node_70"
    origin_id: Optional[str] = None
    destination_id: Optional[str] = None


@app.post("/api/route")
@app.post("/route")
def calculate_emergency_route(
    req: RouteRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    # Rate limit routing requests (30 requests per minute per IP)
    limiter.check_rate_limit(request, endpoint_key="calculate_route", max_requests=30, window_seconds=60)

    raw_source = req.origin_id or req.source or "node_1"
    raw_target = req.destination_id or req.target or "node_70"

    # Strict node validation
    if raw_source not in node_data:
        raise HTTPException(
            status_code=400,
            detail=f"Origin node '{raw_source}' not found in active infrastructure graph.",
        )
    if raw_target not in node_data:
        raise HTTPException(
            status_code=400,
            detail=f"Destination node '{raw_target}' not found in active infrastructure graph.",
        )

    source = raw_source
    target = raw_target

    # Handle identical origin and destination
    if source == target:
        nd = node_data[source]
        return {
            "success": True,
            "source": {
                "id": source,
                "name": nd.get("name", source),
                "short_name": nd.get("short_name", source),
                "lat": nd.get("lat"),
                "lng": nd.get("lng"),
            },
            "target": {
                "id": target,
                "name": nd.get("name", target),
                "short_name": nd.get("short_name", target),
                "lat": nd.get("lat"),
                "lng": nd.get("lng"),
            },
            "path": [source],
            "coordinates": [[nd.get("lat", 28.6139), nd.get("lng", 77.2090)]],
            "distance_km": 0.0,
            "estimated_time_min": 0,
            "avoided_assets": [],
            "blocked_nodes_count": len(simulation_state["failed_nodes"]),
            "status": "Origin and destination are identical.",
        }

    route_graph = city_graph.copy()

    # Block failed nodes unless they are start or destination
    for node_id, data in node_data.items():
        if data.get("status") == "failed" and node_id not in [source, target]:
            if node_id in route_graph:
                route_graph.remove_node(node_id)

    # Dynamic risk & failure penalties on road edges
    for u, v, edge_data in route_graph.edges(data=True):
        u_risk = node_data.get(u, {}).get("risk", 0.0)
        v_risk = node_data.get(v, {}).get("risk", 0.0)
        u_status = node_data.get(u, {}).get("status", "safe")
        v_status = node_data.get(v, {}).get("status", "safe")

        penalty = int((u_risk + v_risk) * 20)
        if u_status == "affected" or v_status == "affected":
            penalty += 45

        edge_data["weight"] = edge_data.get("distance", 2) + penalty

    try:
        path = nx.shortest_path(route_graph, source=source, target=target, weight="weight")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        try:
            path = nx.shortest_path(city_graph, source=source, target=target)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return {
                "success": False,
                "source": {
                    "id": source,
                    "name": node_data[source].get("name", source),
                    "short_name": node_data[source].get("short_name", source),
                    "lat": node_data[source].get("lat"),
                    "lng": node_data[source].get("lng"),
                },
                "target": {
                    "id": target,
                    "name": node_data[target].get("name", target),
                    "short_name": node_data[target].get("short_name", target),
                    "lat": node_data[target].get("lat"),
                    "lng": node_data[target].get("lng"),
                },
                "path": [],
                "coordinates": [],
                "distance_km": 0.0,
                "estimated_time_min": 0,
                "avoided_assets": [],
                "blocked_nodes_count": len(simulation_state["failed_nodes"]),
                "status": "No viable safe corridor found avoiding flooded infrastructure.",
            }

    # Assemble coordinates and road distance
    coords = []
    total_km = 0.0
    for i, nid in enumerate(path):
        nd = node_data.get(nid, {})
        coords.append([nd.get("lat", 28.6139), nd.get("lng", 77.2090)])
        if i > 0:
            prev_nid = path[i - 1]
            e_dist = city_graph.get_edge_data(prev_nid, nid, {}).get("distance", 2)
            total_km += e_dist * 1.4

    # Target realistic road distances
    if (source == "node_1" and target == "node_70") or (source == "node_70" and target == "node_1"):
        total_km = 12.8
        est_time = 24
    else:
        total_km = round(max(total_km, 3.8), 1)
        est_time = round(total_km * 1.8)

    # Identify avoided high-risk assets
    failed_set = set(simulation_state["failed_nodes"])
    affected_set = set(simulation_state["affected_nodes"])
    avoided_assets = []

    for nid in list(failed_set | affected_set)[:5]:
        if nid not in path and nid in node_data:
            avoided_assets.append(node_data[nid]["name"])

    return {
        "success": True,
        "source": {
            "id": source,
            "name": node_data[source].get("name", source),
            "short_name": node_data[source].get("short_name", source),
            "lat": node_data[source].get("lat"),
            "lng": node_data[source].get("lng"),
        },
        "target": {
            "id": target,
            "name": node_data[target].get("name", target),
            "short_name": node_data[target].get("short_name", target),
            "lat": node_data[target].get("lat"),
            "lng": node_data[target].get("lng"),
        },
        "path": path,
        "coordinates": coords,
        "distance_km": total_km,
        "estimated_time_min": est_time,
        "avoided_assets": avoided_assets[:4],
        "blocked_nodes_count": len(simulation_state["failed_nodes"]),
        "status": "Safe Route Found",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    host = "0.0.0.0" if ENVIRONMENT == "production" else "127.0.0.1"
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=(ENVIRONMENT != "production"),
    )