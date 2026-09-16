from typing import Dict, List
import random

import networkx as nx
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import engine, Base, SessionLocal
from models import User
from auth_utils import get_current_user
from routers.auth import router as auth_router, seed_default_user
from routers.historical import router as historical_router
from routers.nepal import router as nepal_router


app = FastAPI(
    title="CityGraph API",
    description="Predictive cascading failure simulation for smart cities",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(historical_router)
app.include_router(nepal_router)


class RainRequest(BaseModel):
    rainfall_level: int = 90


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

    for node_id, data in node_data.items():
        idx = int(node_id.replace("node_", ""))
        ntype = data["type"]

        if node_id == "node_1":
            name = "AIIMS Apex Trauma Center"
            short_name = "AIIMS Trauma"
            type_label = "Emergency Hospital"
            zone = "South Delhi Medical Corridor"
            description = "Primary Level-1 trauma care and emergency surgery hub."
        elif node_id == "node_2":
            name = "Delhi Fire Service HQ Operations"
            short_name = "DFS HQ Station"
            type_label = "Emergency Operations Command"
            zone = "Central Emergency Division"
            description = "Central emergency dispatch and water rescue coordination headquarters."
        elif node_id == "node_10":
            name = "Wazirabad Stormwater Pumping Station"
            short_name = "Wazirabad Pump"
            type_label = "Stormwater Pumping Station"
            zone = "North Yamuna Drainage Basin"
            description = "High-capacity riverfront drainage pump serving North Delhi Ring Road."
        elif node_id == "node_15":
            name = "Civil Lines 220kV Grid Substation"
            short_name = "Civil Lines Substation"
            type_label = "Power Grid Substation"
            zone = "North Power Ring"
            description = "High-voltage transmission substation supplying northern public infrastructure."
        elif node_id == "node_20":
            name = "Kashmere Gate Lowland Sluice Regulator"
            short_name = "Kashmere Gate Sluice"
            type_label = "Stormwater Pumping Station"
            zone = "Old Delhi Lowland Basin"
            description = "Sluice regulator draining Monastery Market and Ring Road lowlands."
        elif node_id == "node_30":
            name = "ITO Drain #12 Relief Regulator"
            short_name = "ITO Drain #12"
            type_label = "Stormwater Pumping Station"
            zone = "Central Yamuna Basin"
            description = "Critical stormwater regulator discharging central government precinct runoff."
        elif node_id == "node_35":
            name = "Pragati Power Transmission Station"
            short_name = "Pragati Power Grid"
            type_label = "Power Grid Substation"
            zone = "Central Power Ring"
            description = "Critical grid hub powering central drainage and transit corridors."
        elif node_id == "node_40":
            name = "Barapullah Main Sluice Regulator #4"
            short_name = "Barapullah Sluice #4"
            type_label = "Stormwater Pumping Station"
            zone = "South-Central Drainage Basin"
            description = "Major stormwater confluence regulator for South Delhi runoff."
        elif node_id == "node_43":
            name = "Ring Road Underpass #43 (Mathura Road Link)"
            short_name = "Ring Road Underpass #43"
            type_label = "Arterial Road Junction"
            zone = "South-East Arterial Transit Corridor"
            description = "Depressed arterial underpass connecting Ring Road to Mathura Road commercial corridor."
        elif node_id == "node_50":
            name = "Okhla Barrage Outfall Pumping Facility"
            short_name = "Okhla Outfall Pump"
            type_label = "Stormwater Pumping Station"
            zone = "South-East River Basin"
            description = "Terminal outfall pumping station for southern Delhi stormwater canals."
        elif node_id == "node_55":
            name = "Sarita Vihar High-Voltage Substation"
            short_name = "Sarita Vihar Substation"
            type_label = "Power Grid Substation"
            zone = "South Power Ring"
            description = "Transmission substation powering southern drainage pump networks."
        elif node_id == "node_60":
            name = "Mayur Vihar Spillway Pump Station"
            short_name = "Mayur Vihar Pump"
            type_label = "Stormwater Pumping Station"
            zone = "Trans-Yamuna Drainage Basin"
            description = "Pumping station protecting low-lying eastern floodplain communities."
        else:
            corridor = delhi_corridor_names[idx % len(delhi_corridor_names)]
            name = f"{corridor} (#{idx})"
            short_name = f"Junction #{idx}"
            type_label = "Arterial Road Junction"
            zone = "Municipal Transit Grid"
            description = f"Arterial transit crossing linking {corridor} with surrounding infrastructure."

        neighbors = list(city_graph.neighbors(node_id))

        data.update({
            "name": name,
            "short_name": short_name,
            "type_label": type_label,
            "zone": zone,
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
    request: RainRequest,
    current_user: User = Depends(get_current_user),
):
    return run_heavy_rain_simulation(request.rainfall_level)


@app.post("/reset")
def reset(current_user: User = Depends(get_current_user)):
    reset_simulation_state()
    return get_complete_graph_response()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )