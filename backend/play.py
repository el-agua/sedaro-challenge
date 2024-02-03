import doctest
import json
from functools import reduce
from operator import __or__
from random import random
from models import db, Object, Timestamp, Universe


def run_sim(universe_id):
    # MODELING & SIMULATION

    objects = Object.query.filter_by(universe_id=universe_id).all()
    init = {}
    masses = {}
    for obj in objects:
        init[obj.object_name] = obj.timestamps[0].to_sim_object()
        masses[obj.object_name] = obj.mass
    def propagate(agentId, universe):
        """Propagate agentId from `time` to `time + timeStep`."""
        state = universe[agentId]
        time, timeStep, x, y, vx, vy = state['time'], state['timeStep'], state['x'], state['y'], state['vx'], state['vy']
        fx = 0
        fy = 0
        for universe_obj in universe.keys():
            """Appends the force due to the gravitational pull of the universe_obj on agentId to fx and fy."""
            if universe_obj == agentId:
                continue
            m = masses[universe_obj]
            px, py = universe[universe_obj]['x'], universe[universe_obj]['y']
            dx = px - x
            dy = py - y
            fx += (m/500.0) * dx / (dx**2 + dy**2)**(3/2)
            fy += (m/500.0) * dy / (dx**2 + dy**2)**(3/2)
        vx += fx * timeStep
        vy += fy * timeStep
        x += vx * timeStep
        y += vy * timeStep

        return {'time': time + timeStep, 'timeStep': 0.01, 'x': x, 'y': y, 'vx': vx, 'vy': vy}

    # DATA STRUCTURE

    class QRangeStore:
        """
        A Q-Range KV Store mapping left-inclusive, right-exclusive ranges [low, high) to values.
        Reading from the store returns the collection of values whose ranges contain the query.
        ```
        0  1  2  3  4  5  6  7  8  9
        [A      )[B)            [E)
        [C   )[D   )
            ^       ^        ^  ^
        ```
        >>> store = QRangeStore()
        >>> store[0, 3] = 'Record A'
        >>> store[3, 4] = 'Record B'
        >>> store[0, 2] = 'Record C'
        >>> store[2, 4] = 'Record D'
        >>> store[8, 9] = 'Record E'
        >>> store[2, 0] = 'Record F'
        Traceback (most recent call last):
        IndexError: Invalid Range.
        >>> store[2.1]
        ['Record A', 'Record D']
        >>> store[8]
        ['Record E']
        >>> store[5]
        Traceback (most recent call last):
        IndexError: Not found.
        >>> store[9]
        Traceback (most recent call last):
        IndexError: Not found.
        """
        def __init__(self): self.store = []
        def __setitem__(self, rng, value): 
            (low, high) = rng
            if not low < high: raise IndexError("Invalid Range.")
            self.store.append((low, high, value))
        def __getitem__(self, key):
            ret = [v for (l, h, v) in self.store if l <= key < h] 
            if not ret: raise IndexError("Not found.")
            return ret
        
    doctest.testmod()

    # SIMULATOR

    def read(t):
        try:
            data = store[t]
        except IndexError:
            data = []
        return reduce(__or__, data, {})

    store = QRangeStore()
    store[-999999999, 0] = init
    times = {agentId: state['time'] for agentId, state in init.items()}

    num_objects = len(init)
    for _ in range(500*num_objects):
        for agentId in init:
            t = times[agentId]
            universe = read(t-0.001)
            if set(universe) == set(init):
                newState = propagate(agentId, universe)
                store[t, newState['time']] = {agentId: newState}
                times[agentId] = newState['time']
    """Adds the new timestamps to the database."""
    for obj in objects:
        obj.timestamps = []
        Timestamp.query.filter_by(object_id=obj.id).delete()
        t = Timestamp(time=init[obj.object_name]['time'], timeStep=init[obj.object_name]['timeStep'], x=init[obj.object_name]['x'], y=init[obj.object_name]['y'], vx=init[obj.object_name]['vx'], vy=init[obj.object_name]['vy'], object_id=obj.id)
        obj.timestamps.append(t)
    
    db.session.commit()
    for timestamp in store.store:
        if timestamp[0] == -999999999:
            continue
        for key in timestamp[2]:
            obj = Object.query.filter_by(universe_id=universe_id, object_name=key).first()
            t = Timestamp(time=timestamp[0], timeStep=timestamp[1], x=timestamp[2][key]['x'], y=timestamp[2][key]['y'], vx=timestamp[2][key]['vx'], vy=timestamp[2][key]['vy'], object_id=obj.id)
            obj.timestamps.append(t)
    db.session.commit()

    """Writes the new universe to the database."""
    with open('data.json', 'w') as f:
        f.write(json.dumps(store.store, indent=4))