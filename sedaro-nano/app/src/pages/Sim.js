import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import NavBar from "../components/NavBar";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Row,
  Col,
  Card,
  Button,
  ListGroup,
  Form,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useParams } from "react-router-dom";
const App = () => {
  // Store plot data in state.
  const { universe_id } = useParams();
  const [plotData, setPlotData] = useState([]);
  const [universe_name, setUniverseName] = useState("Universe Name");
  const [objects, setObjects] = useState([]);
  const [formName, setFormName] = useState();
  const [formY, setFormY] = useState();
  const [formX, setFormX] = useState();
  const [formVX, setFormVX] = useState();
  const [formVY, setFormVY] = useState();
  const [formMass, setFormMass] = useState();
  const [submitted, setSubmitted] = useState(false);

  const [validated, setValidated] = useState(false);
  async function restartSimulation() {
    console.log("restarting simulation...");
    console.log("calling fetchdata...");

    try {
      // 'data.json' should be populated from a run of sim.py
      const response = await fetch(
        "http://localhost:5000/universe/" + String(universe_id)
      );
      const data = await response.json();
      console.log(data);
      const updatedPlotData = {};

      setUniverseName(data.name);
      let tempObjects = [];
      for (let i = 0; i < data.objects.length; i++) {
        let o = {
          id: data.objects[i].id,
          name: data.objects[i].object_name,
          mass: data.objects[i].mass,
          x: data.objects[i].timestamps[0].x,
          y: data.objects[i].timestamps[0].y,
          vx: data.objects[i].timestamps[0].vx,
          vy: data.objects[i].timestamps[0].vy,
        };
        tempObjects.push(o);
        updatedPlotData[data.objects[i].object_name] = {
          x: [],
          y: [],
          name: data.objects[i].object_name,
        };
        for (let j = 0; j < data.objects[i].timestamps.length; j++) {
          updatedPlotData[data.objects[i].object_name].x.push(
            data.objects[i].timestamps[j].x
          );
          updatedPlotData[data.objects[i].object_name].y.push(
            data.objects[i].timestamps[j].y
          );
        }
      }
      setObjects(tempObjects);
      setPlotData(Object.values(updatedPlotData));
      console.log("plotData:", Object.values(updatedPlotData));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  const runSimulation = () => {
    const newObject = {
      universe_id: parseInt(universe_id),
    };
    fetch("http://localhost:5000/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newObject),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        restartSimulation();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  const handleDelete = (index) => {
    console.log(index);
    const id = index.id;
    console.log("deleting object with id: " + id);
    fetch("http://localhost:5000/object/" + String(id), {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        refreshObjects();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  const handleSubmit = (event) => {
    setSubmitted(true);
    const a = RegExp("^[+-]?([0-9]*[.])?[0-9]+$").test(formMass);
    const b = RegExp("^[+-]?([0-9]*[.])?[0-9]+$").test(formX);
    const c = RegExp("^[+-]?([0-9]*[.])?[0-9]+$").test(formY);
    const d = RegExp("^[+-]?([0-9]*[.])?[0-9]+$").test(formVX);
    const e = RegExp("^[+-]?([0-9]*[.])?[0-9]+$").test(formVY);
    event.preventDefault();
    if (!(a && b && c && d && e)) {
      event.stopPropagation();
      return;
    }
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.stopPropagation();
      return;
    }

    setValidated(true);
    // Create object via post request
    setFormMass();
    setFormX();
    setFormY();
    setFormVX();
    setFormVY();
    setFormName();
    setSubmitted(false);
    event.target.reset();

    const objectName = formName;
    const objectMass = formMass;
    const objectX = formX;
    const objectY = formY;
    const objectVX = formVX;
    const objectVY = formVY;
    const init = {
      time: 0,
      timeStep: 0.01,
      x: parseFloat(objectX),
      y: parseFloat(objectY),
      vx: parseFloat(objectVX),
      vy: parseFloat(objectVY),
    };
    const newObject = {
      universe_id: parseInt(universe_id),
      object_name: objectName,
      mass: parseFloat(objectMass),
      init: init,
    };
    console.log(newObject);
    fetch("http://localhost:5000/object", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newObject),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        refreshObjects();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  const refreshObjects = () => {
    console.log("refreshing objects...");
    fetch("http://localhost:5000/universe/" + String(universe_id))
      .then((response) => response.json())
      .then((data) => {
        let tempObjects = [];
        for (let i = 0; i < data.objects.length; i++) {
          let o = {
            id: data.objects[i].id,
            name: data.objects[i].object_name,
            mass: data.objects[i].mass,
            x: data.objects[i].timestamps[0].x,
            y: data.objects[i].timestamps[0].y,
            vx: data.objects[i].timestamps[0].vx,
            vy: data.objects[i].timestamps[0].vy,
          };
          tempObjects.push(o);
        }
        setObjects(tempObjects);
      });
  };
  useEffect(() => {
    // fetch plot data when the component mounts
    restartSimulation();
  }, []);

  return (
    <div>
      <NavBar />
      <div style={{ padding: "20px" }}>
        <Row>
          <Col xs={3} style={{ padding: "20px" }}>
            <Card
              className="shadow-sm"
              style={{
                borderRadius: "15px",
                backgroundColor: "#333",
                color: "#fff",
              }}
            >
              <Card.Header
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  backgroundColor: "#444",
                  borderBottom: "none",
                }}
              >
                {universe_name}
              </Card.Header>

              <Card.Body>
                <Button
                  variant="success"
                  className="w-100 mt-3 mb-3 p-2 rounded-0"
                  style={{ borderColor: "#555" }}
                  onClick={runSimulation}
                >
                  Run Simulation
                </Button>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="formObjectName" className="mb-2">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter object name"
                          className="rounded-0 py-1"
                          isInvalid={submitted && !formName}
                          onChange={(e) => {
                            setFormName(e.target.value);
                          }}
                          style={{
                            backgroundColor: "#555",
                            borderColor: "#555",
                            color: "#fff",
                          }}
                        />
                        {submitted && (
                          <Form.Control.Feedback type="invalid">
                            Please provide a name.
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="formObjectMass" className="mb-2">
                        <Form.Label>Mass</Form.Label>
                        <Form.Control
                          type="text"
                          isInvalid={
                            !(
                              RegExp("^[+-]?([0-9]*[.])?[0-9]+$").test(
                                formMass
                              ) || !submitted
                            )
                          }
                          onChange={(e) => {
                            setFormMass(e.target.value);
                          }}
                          placeholder="Enter object mass"
                          className="rounded-0 py-1"
                          style={{
                            backgroundColor: "#555",
                            borderColor: "#555",
                            color: "#fff",
                          }}
                        />
                        {submitted && (
                          <Form.Control.Feedback type="invalid">
                            Please provide a floating point number.
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="formObjectX" className="mb-2">
                        <Form.Label>X</Form.Label>
                        <Form.Control
                          type="text"
                          isInvalid={
                            !(
                              RegExp("^[+-]?([0-9]*[.])?[0-9]+$").test(formX) ||
                              !submitted
                            )
                          }
                          onChange={(e) => {
                            setFormX(e.target.value);
                          }}
                          placeholder="Enter object x"
                          className="rounded-0 py-1"
                          style={{
                            backgroundColor: "#555",
                            borderColor: "#555",
                            color: "#fff",
                          }}
                        />
                        {submitted && (
                          <Form.Control.Feedback type="invalid">
                            Please provide a floating point number.
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="formObjectY" className="mb-2">
                        <Form.Label>Y</Form.Label>
                        <Form.Control
                          type="text"
                          isInvalid={
                            !(
                              RegExp("^[+-]?([0-9]*[.])?[0-9]+$").test(formY) ||
                              !submitted
                            )
                          }
                          onChange={(e) => {
                            setFormY(e.target.value);
                          }}
                          placeholder="Enter object y"
                          className="rounded-0 py-1"
                          style={{
                            backgroundColor: "#555",
                            borderColor: "#555",
                            color: "#fff",
                          }}
                        />
                        {submitted && (
                          <Form.Control.Feedback type="invalid">
                            Please provide a floating point number.
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="formObjectVX" className="mb-2">
                        <Form.Label>VX</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter object vx"
                          className="rounded-0 py-1"
                          isInvalid={
                            !(
                              RegExp("^[+-]?([0-9]*[.])?[0-9]+$").test(
                                formVX
                              ) || !submitted
                            )
                          }
                          onChange={(e) => {
                            setFormVX(e.target.value);
                          }}
                          style={{
                            backgroundColor: "#555",
                            borderColor: "#555",
                            color: "#fff",
                          }}
                        />
                        {submitted && (
                          <Form.Control.Feedback type="invalid">
                            Please provide a floating point number.
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="formObjectVY" className="mb-2">
                        <Form.Label>VY</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter object vy"
                          className="rounded-0 py-1"
                          isInvalid={
                            !(
                              RegExp("^[+-]?([0-9]*[.])?[0-9]+$").test(
                                formVY
                              ) || !submitted
                            )
                          }
                          onChange={(e) => {
                            setFormVY(e.target.value);
                          }}
                          style={{
                            backgroundColor: "#555",
                            borderColor: "#555",
                            color: "#fff",
                          }}
                        />
                        {submitted && (
                          <Form.Control.Feedback type="invalid">
                            Please provide a floating point number.
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Button
                    variant="outline-light"
                    type="submit"
                    className="w-100 mt-2 rounded-0"
                  >
                    Create Object
                  </Button>
                </Form>
                <ListGroup variant="flush" className="mt-3">
                  {objects.map((object, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Body>
                        <Row>
                          <Col className="small">
                            {" "}
                            {/* Add the 'small' class to the Col */}
                            <Card.Title>{object.name}</Card.Title>
                          </Col>
                          <Col xs="auto">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(object)}
                            >
                              Delete
                            </Button>{" "}
                            {/* Add the 'sm' size to the Button */}
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={9}>
            <Plot
              style={{ width: "100%", height: "90vh", left: 0, top: 0 }}
              data={plotData}
              layout={{
                title: "Workspace",
                yaxis: { scaleanchor: "x" },
                autosize: true,
              }}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default App;
