import { useEffect, useState } from "react";
import type { Tank } from "@streaming/shared";
import { getTankIconUrl } from "@streaming/shared";

const TanksList = () => {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/tanks")
      .then((res) => res.json())
      .then((data) => {
        setTanks(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching tanks:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <h1>Список танков</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {tanks.map((tank) => (
          <div
            key={tank.tech_name || tank.vehicle_cd}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            {(() => {
              const iconUrl = getTankIconUrl(tank);
              if (!iconUrl) return null;

              return (
                <img
                  src={iconUrl}
                  alt={tank.name || ""}
                  style={{
                    width: "80px",
                    height: "60px",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              );
            })()}
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>
                {tank.name || tank.tech_name}
              </h3>
              <p style={{ margin: 0, color: "#666" }}>Уровень: {tank.tier}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TanksList;
