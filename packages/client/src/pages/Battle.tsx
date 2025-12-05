import { useEffect, useState, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import type { GameState, GameTank, GameProjectile } from "@streaming/shared";
import { getTankIconUrl } from "@streaming/shared";
import BattleLine from "../components/BattleLine";

const MAP_WIDTH = 2000;
const MAP_HEIGHT = 200; // высота для вида сбоку
const SCALE = 0.5; // масштаб для отображения
const NUM_LANES = 20; // количество полос глубины
const BASE_SIZE = 100; // базовый размер в процентах (самая дальняя полоса)
const MAX_SIZE = 150; // максимальный размер в процентах (самая близкая полоса) - разница 50%
const LANE_HEIGHT_OFFSET = 2; // смещение каждой полосы в пикселях

const Battle = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [tankHeights, setTankHeights] = useState<Map<string, number>>(
    new Map()
  );
  const [useColorizedIcons, setUseColorizedIcons] = useState(true);
  const [showHealthBars, setShowHealthBars] = useState(false);
  const [showTankNames, setShowTankNames] = useState(false);

  // Референсы для интерполяции
  const lastGameStateRef = useRef<GameState | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Компонент битвы танков

  useEffect(() => {
    const newSocket = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to game server", newSocket.id);
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from game server");
      setConnected(false);
    });

    newSocket.on("gameState", (state: GameState) => {
      lastGameStateRef.current = state;
      lastUpdateTimeRef.current = Date.now();
      setGameState(state);
    });

    // Сохраняем socket для использования в обработчике клика
    (window as any).battleSocket = newSocket;

    return () => {
      newSocket.disconnect();
      delete (window as any).battleSocket;
    };
  }, []);

  const getTankIconUrlForDisplay = (tank: GameTank): string | null => {
    const originalUrl = getTankIconUrl(tank.tankData);
    if (!originalUrl) {
      console.warn("No icon URL for tank:", tank.tankData.name);
      return null;
    }

    // Если цветные иконки включены, используем endpoint сервера
    if (useColorizedIcons) {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `http://localhost:3000/tanks/colorized-icon?url=${encodedUrl}`;
    }

    // Иначе возвращаем оригинальный URL
    return originalUrl;
  };

  // Получаем размер для полосы (в процентах)
  const getLaneSize = (lane: number): number => {
    // lane 0 = 100%, lane 19 = 120%
    return BASE_SIZE + (lane / (NUM_LANES - 1)) * (MAX_SIZE - BASE_SIZE);
  };

  // Получаем позицию Y для полосы
  const getLaneY = (lane: number): number => {
    // Самая дальняя полоса (0) вверху, самая близкая (19) внизу
    // Каждая полоса на 2px ниже предыдущей
    const baseY = MAP_HEIGHT * SCALE; // базовая позиция земли
    return baseY - (NUM_LANES - 1 - lane) * LANE_HEIGHT_OFFSET;
  };

  const getTankX = (x: number) => {
    return (x / MAP_WIDTH) * (MAP_WIDTH * SCALE);
  };

  // Мемоизация распределения танков и пуль по полосам
  const lanesData = useMemo(() => {
    if (!gameState) return [];

    const lanes: Array<{
      laneIndex: number;
      tanks: GameTank[];
      projectiles: GameProjectile[];
      laneSize: number;
      laneY: number;
    }> = [];

    for (let laneIndex = 0; laneIndex < NUM_LANES; laneIndex++) {
      const tanksOnLane = gameState.tanks.filter(
        (tank) => (tank.lane ?? 0) === laneIndex
      );

      const projectilesOnLane = gameState.projectiles.filter((projectile) => {
        const shooter = gameState.tanks.find(
          (t) => t.id === projectile.shooterId
        );
        return shooter && (shooter.lane ?? 0) === laneIndex;
      });

      lanes.push({
        laneIndex,
        tanks: tanksOnLane,
        projectiles: projectilesOnLane,
        laneSize: getLaneSize(laneIndex),
        laneY: getLaneY(laneIndex),
      });
    }

    return lanes;
  }, [gameState]);

  return (
    <div>
      {gameState && (
        <>
          <div
            style={{
              position: "relative",
              width: MAP_WIDTH * SCALE,
              height: MAP_HEIGHT * SCALE,
              margin: "0 auto",
              overflow: "hidden",
              cursor: "pointer",
            }}
            onClick={() => {
              const socket = (window as any).battleSocket;
              if (socket) {
                socket.emit("togglePause");
              }
            }}
          >
            {/* Индикатор паузы */}
            {gameState.isPaused && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  color: "#fff",
                  padding: "20px 40px",
                  borderRadius: "10px",
                  fontSize: "24px",
                  fontWeight: "bold",
                  zIndex: 1000,
                  pointerEvents: "none",
                }}
              >
                ⏸ ПАУЗА
              </div>
            )}

            {/* 20 дорожек (BattleLine компонентов) */}
            {lanesData.map((laneData) => {
              return (
                <BattleLine
                  key={laneData.laneIndex}
                  scale={laneData.laneSize}
                  style={{
                    bottom: MAP_HEIGHT * SCALE - laneData.laneY,
                    zIndex: 10 + laneData.laneIndex,
                  }}
                >
                  {/* Танки на этой полосе */}
                  {laneData.tanks.map((tank: GameTank) => {
                    const iconUrl = getTankIconUrlForDisplay(tank);
                    const tankX = getTankX(tank.x);
                    const healthPercent = (tank.health / tank.maxHealth) * 100;
                    const healthColor =
                      tank.side === "left" ? "#4CAF50" : "#F44336";

                    return (
                      <div
                        key={tank.id}
                        style={{
                          position: "absolute",
                          left: tankX,
                          bottom: 0,
                          transform: "translateX(-50%)",
                          transition: "left 0.05s linear",
                          willChange: "left",
                        }}
                      >
                        {/* Индикатор здоровья */}
                        {showHealthBars && (
                          <div
                            style={{
                              position: "absolute",
                              top: -20,
                              left: 0,
                              width: "100%",
                              height: 6,
                              backgroundColor: "#333",
                              borderRadius: 3,
                              overflow: "hidden",
                              transformOrigin: "top center",
                            }}
                          >
                            <div
                              style={{
                                width: `${healthPercent}%`,
                                height: "100%",
                                backgroundColor: healthColor,
                                transition: "width 0.1s ease",
                              }}
                            />
                          </div>
                        )}

                        {/* Название танка */}
                        {showTankNames && (
                          <div
                            style={{
                              position: "absolute",
                              top: showHealthBars ? -60 : -40,
                              left: "50%",
                              transform: "translateX(-50%)",
                              whiteSpace: "nowrap",
                              fontSize: "12px",
                              fontWeight: "bold",
                              color: "#fff",
                              textShadow: `
                                -1px -1px 0 #000,
                                1px -1px 0 #000,
                                -1px 1px 0 #000,
                                1px 1px 0 #000
                              `,
                              pointerEvents: "none",
                              zIndex: 20,
                            }}
                          >
                            {tank.tankData.name || "Танк"}
                          </div>
                        )}

                        {/* Танк */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            transform:
                              tank.side === "right" ? "scaleX(-1)" : "",
                            transformOrigin: "bottom center",
                          }}
                          title={`${
                            tank.tankData.name || "Танк"
                          } | HP: ${Math.round(tank.health)}/${
                            tank.maxHealth
                          } | Полоса: ${laneData.laneIndex}`}
                        >
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt={tank.tankData.name || "Танк"}
                              style={{
                                display: "block",
                                maxWidth: "none",
                                height: "auto",
                              }}
                              onLoad={(e) => {
                                const target = e.target as HTMLImageElement;
                                const height =
                                  target.naturalHeight || target.offsetHeight;
                                setTankHeights((prev) => {
                                  const newMap = new Map(prev);
                                  newMap.set(tank.id, height);
                                  return newMap;
                                });
                              }}
                              onError={(e) => {
                                console.error(
                                  "Failed to load tank icon:",
                                  iconUrl,
                                  tank.tankData.name
                                );
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div style="width: 40px; height: 30px; background: ${
                                    tank.side === "left" ? "#4CAF50" : "#F44336"
                                  }; border: 2px solid #000; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${
                                    tank.isShooting ? "⚡" : "▣"
                                  }</div>`;
                                  setTankHeights((prev) => {
                                    const newMap = new Map(prev);
                                    newMap.set(tank.id, 30);
                                    return newMap;
                                  });
                                }
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 40,
                                height: 30,
                                backgroundColor:
                                  tank.side === "left" ? "#4CAF50" : "#F44336",
                                border: "2px solid #000",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: "bold",
                              }}
                            >
                              {tank.isShooting ? "⚡" : "▣"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Снаряды на этой полосе */}
                  {laneData.projectiles.map((projectile: GameProjectile) => {
                    const shooter = gameState.tanks.find(
                      (t) => t.id === projectile.shooterId
                    );
                    if (!shooter) return null;

                    // Получаем реальную высоту изображения танка
                    const tankHeight = tankHeights.get(shooter.id) || 20;
                    // Пули на уровне 2/3 от высоты изображения танка
                    const bulletOffset = tankHeight * (2 / 3);

                    return (
                      <div
                        key={projectile.id}
                        style={{
                          position: "absolute",
                          left: getTankX(projectile.x) - 2,
                          bottom: bulletOffset,
                          width: 4,
                          height: 4,
                          backgroundColor: "#FFD700",
                          borderRadius: "50%",
                          border: "1px solid #FFA500",
                          boxShadow: "0 0 3px #FFD700",
                          transition: "left 0.05s linear",
                          willChange: "left",
                        }}
                      />
                    );
                  })}
                </BattleLine>
              );
            })}
          </div>
        </>
      )}

      {/* Настройки и информация */}
      <div style={{ marginTop: "20px", padding: "0 20px" }}>
        <h1>Битва танков</h1>
        <div
          style={{
            marginBottom: "10px",
            display: "flex",
            gap: "20px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>Статус: {connected ? "Подключено" : "Отключено"}</div>
          {gameState && (
            <div>
              Танков на поле: {gameState.tanks.length} | Снарядов:{" "}
              {gameState.projectiles.length}
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={useColorizedIcons}
                onChange={(e) => setUseColorizedIcons(e.target.checked)}
              />
              <span>Цветные иконки</span>
            </label>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={showHealthBars}
                onChange={(e) => setShowHealthBars(e.target.checked)}
              />
              <span>Полоски жизней</span>
            </label>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={showTankNames}
                onChange={(e) => setShowTankNames(e.target.checked)}
              />
              <span>Названия танков</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Battle;
