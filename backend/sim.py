import doctest
import json
from functools import reduce
from operator import __or__
from random import random
from models import db, Object, Timestamp, Universe


def run_sim():
    # MODELING & SIMULATION

    init = {
        'Planet': {'time': 0, 'timeStep': 0.01, 'x': 0, 'y': 0.1, 'vx': 0.1, 'vy': 0},
        'Satellite': {'time': 0, 'timeStep': 0.01, 'x': 0, 'y': 1, 'vx': 1, 'vy': 0},
    }
    universe = Universe(name='Universe1')
    db.session.add(universe)
    db.session.commit()
    db.session.refresh(universe)
    planet = Object(object_name='Planet', mass=500, universe_id=universe.id)
    satellite = Object(object_name='Satellite', mass=5, universe_id=universe.id)
    universe.objects.append(planet)
    universe.objects.append(satellite)
    db.session.commit()
    def propagate(agentId, universe):
        """Propagate agentId from `time` to `time + timeStep`."""
        state = universe[agentId]
        time, timeStep, x, y, vx, vy = state['time'], state['timeStep'], state['x'], state['y'], state['vx'], state['vy']

        if agentId == 'Planet':
            x += vx * timeStep
            y += vy * timeStep
        elif agentId == 'Satellite':
            px, py = universe['Planet']['x'], universe['Planet']['y']
            dx = px - x
            dy = py - y
            fx = dx / (dx**2 + dy**2)**(3/2)
            fy = dy / (dx**2 + dy**2)**(3/2)
            vx += fx * timeStep
            vy += fy * timeStep
            x += vx * timeStep
            y += vy * timeStep

        return {'time': time + timeStep, 'timeStep': 0.01+random()*0.09, 'x': x, 'y': y, 'vx': vx, 'vy': vy}

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

    for _ in range(500):
        for agentId in init:
            t = times[agentId]
            universe = read(t-0.001)
            if set(universe) == set(init):
                newState = propagate(agentId, universe)
                store[t, newState['time']] = {agentId: newState}
                times[agentId] = newState['time']
    for timestamp in store.store:
        replace = False
        if timestamp[0] < 0:
            replace = True
        for key in timestamp[2]:
            obj = Object.query.filter_by(object_name=key).first()
            t = Timestamp(time=(0 if replace else timestamp[0]), timeStep=(0.01 if replace else timestamp[1]), x=timestamp[2][key]['x'], y=timestamp[2][key]['y'], vx=timestamp[2][key]['vx'], vy=timestamp[2][key]['vy'], object_id=obj.id)
            obj.timestamps.append(t)
    db.session.commit()

    with open('data.json', 'w') as f:
        f.write(json.dumps(store.store, indent=4))