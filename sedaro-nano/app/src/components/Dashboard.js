import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [universes, setUniverses] = useState([]);
  const [form, setForm] = useState({
    name: "DefaultUniverse" + String(Math.floor(Math.random * 100000)),
  });
  const handleCreate = () => {
    fetch("http://localhost:5000/universe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: form }),
    })
      .then((response) => response.json())
      .then((data) => setUniverses([...universes, data]))
      .catch((error) => console.error("Error:", error));
  };
  useEffect(() => {
    fetch("http://localhost:5000/universe")
      .then((response) => response.json())
      .then((data) => setUniverses(data))
      .catch((error) => console.error("Error:", error));
  }, []);

  return (
    <div style={{ padding: "80px" }}>
      <h1 style={{ fontSize: "3.5em" }}>My Universes</h1>
      <div className="mt-4">
        <Row>
          <Col sm={4}>
            <Card
              className="mb-4 h-100"
              style={{
                padding: "20px",
                backgroundColor: "#f8f9fa",
              }}
            >
              <Card.Body style={{ flex: 1 }}>
                <Form.Control
                  required
                  type="text"
                  onChange={(e) => {
                    setForm(e.target.value);
                  }}
                  placeholder="Enter universe name"
                />
                <Button className="mt-4" onClick={handleCreate}>
                  Create New Universe
                </Button>
              </Card.Body>
            </Card>
          </Col>
          {universes.map((universe, index) => (
            <Col sm={4} key={index}>
              <Link to={`/sim/${universe.id}`}>
                <Card
                  className="mb-4 h-100"
                  style={{
                    padding: "20px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <Card.Body style={{ flex: 1 }}>
                    <Card.Title>{universe.name}</Card.Title>
                    <Card.Text>Objects: {universe.objects.length}</Card.Text>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;
