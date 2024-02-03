import sim
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import play
import random

app = Flask(__name__)

db_path = os.path.join(os.path.dirname(__file__), 'sedaro_db.db')
print(db_path)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///{}'.format(db_path)
app.config['DEBUG'] = True

from models import db, Timestamp, Object, Universe  # Import db from models.py

db.init_app(app)
CORS(app)

@app.route("/")
def hello_world():
    """Just to visualize that the server is running."""
    universe = Universe.query.first()
    return universe.to_json()

@app.route("/universe", methods=['POST'])
def create_universe():
    """Create a universe."""
    data = request.get_json()
    name = data['name']
    universe = Universe.query.filter_by(name=name).first()
    if universe is not None:
        return jsonify({"error": "A universe with this name already exists"}), 400
    universe = Universe(name=name)
    db.session.add(universe)
    db.session.commit()
    return universe.to_json()

@app.route("/universe", methods=['GET'])
def get_universes():
    """Get all universes."""
    universes = Universe.query.all()
    return jsonify([u.to_display() for u in universes])

@app.route("/universe/<int:universe_id>", methods=['GET'])
def get_universe(universe_id):
    """Get a universe by its id."""
    universe = Universe.query.filter_by(id=universe_id).first()
    if universe is None:
        return jsonify({"error": "The universe you requested does not exist"}), 404
    return universe.to_json()

@app.route("/object", methods=['POST'])
def create_object():
    """Create an object in a universe. The object is created with an initial timestamp."""
    data = request.get_json()
    universe_id = data['universe_id']
    object_name = data['object_name']
    init = data['init'] if 'init' in data else None
    if init is None:
        init = {'time': 0, 'timeStep': 0.01, 'x': 3*random.random(), 'y': 3*random.random(), 'vx': 0.1, 'vy': 0}
    mass = data['mass']
    universe = Universe.query.filter_by(id=universe_id).first()
    if universe is None:
        return jsonify({"error": "The universe you requested does not exist"}), 404
    obj = Object.query.filter_by(object_name=object_name, universe_id=universe_id).first() 
    if obj is not None:
        return jsonify({"error": "An object with this name already exists in this universe"}), 400
    object = Object(object_name=object_name, mass=mass, universe_id=universe_id)
    universe.objects.append(object)
    db.session.add(object)
    db.session.commit()
    init_timestamp = Timestamp(time=init['time'], timeStep=init['timeStep'], x=init['x'], y=init['y'], vx=init['vx'], vy=init['vy'], object_id=object.id)
    db.session.add(init_timestamp)
    object.timestamps.append(init_timestamp)
    db.session.commit()
    return object.to_json()

@app.route("/object/<int:object_id>", methods=['DELETE'])
def delete_object(object_id):
    """Delete an object by its id."""
    object = Object.query.filter_by(id=object_id).first()
    if object is None:
        return jsonify({"error": "The object you requested does not exist"}), 404
    db.session.delete(object)
    db.session.commit()
    return jsonify({"success": "Object deleted"}), 200

@app.route("/run", methods=['POST'])
def run_sim():
    """Run the simulation for a universe."""
    data = request.get_json()
    universe_id = data['universe_id']
    universe = Universe.query.filter_by(id=universe_id).first()
    if universe is None:
        return jsonify({"error": "The universe you requested does not exist"}), 404
    if universe.objects == []:
        return jsonify({"error": "The universe you requested is empty"}), 400
    play.run_sim(universe_id)
    u = Universe.query.filter_by(id=universe_id).first().to_json()
    return u

with app.app_context():
    db.drop_all()
    db.create_all()
    sim.run_sim()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)