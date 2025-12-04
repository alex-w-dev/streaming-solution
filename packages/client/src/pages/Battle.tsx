import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { GameState, GameTank, GameProjectile } from '@streaming/shared';
import { getTankIconUrl } from '@streaming/shared';

const MAP_WIDTH = 2000;
const MAP_HEIGHT = 600; // высота для вида сбоку
const SCALE = 0.5; // масштаб для отображения
const GROUND_Y = MAP_HEIGHT * SCALE - 50; // позиция земли (вид сбоку)

const Battle = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [tankHeights, setTankHeights] = useState<Map<string, number>>(new Map());
  const [useColorizedIcons, setUseColorizedIcons] = useState(true);
  const [showHealthBars, setShowHealthBars] = useState(true);

  // Компонент битвы танков

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to game server', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from game server');
      setConnected(false);
    });

    newSocket.on('gameState', (state: GameState) => {
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
      console.warn('No icon URL for tank:', tank.tankData.name);
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

  const getTankX = (x: number) => {
    return (x / MAP_WIDTH) * (MAP_WIDTH * SCALE);
  };


  return (
    <div style={{ padding: '20px' }}>
      <h1>Битва танков</h1>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          Статус: {connected ? 'Подключено' : 'Отключено'}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useColorizedIcons}
              onChange={(e) => setUseColorizedIcons(e.target.checked)}
            />
            <span>Цветные иконки</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showHealthBars}
              onChange={(e) => setShowHealthBars(e.target.checked)}
            />
            <span>Полоски жизней</span>
          </label>
        </div>
      </div>
      {gameState && (
        <>
          <div style={{ marginBottom: '10px' }}>
            Танков на поле: {gameState.tanks.length} | Снарядов: {gameState.projectiles.length}
          </div>
          <div
            style={{
              position: 'relative',
              width: MAP_WIDTH * SCALE,
              height: MAP_HEIGHT * SCALE,
              border: '2px solid #333',
              backgroundColor: '#87CEEB',
              margin: '0 auto',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => {
              const socket = (window as any).battleSocket;
              if (socket) {
                socket.emit('togglePause');
              }
            }}
          >
            {/* Индикатор паузы */}
            {gameState.isPaused && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: '#fff',
                  padding: '20px 40px',
                  borderRadius: '10px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  zIndex: 1000,
                  pointerEvents: 'none',
                }}
              >
                ⏸ ПАУЗА
              </div>
            )}
            {/* Земля (вид сбоку) */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: 50,
                backgroundColor: '#8B7355',
                borderTop: '2px solid #654321',
              }}
            />

            {/* Респауны */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: 30,
                height: 50,
                backgroundColor: '#4CAF50',
                opacity: 0.7,
                borderRight: '3px solid #2E7D32',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 30,
                height: 50,
                backgroundColor: '#F44336',
                opacity: 0.7,
                borderLeft: '3px solid #C62828',
              }}
            />

            {/* Танки (вид сбоку) */}
            {gameState.tanks.map((tank: GameTank) => {
              const iconUrl = getTankIconUrlForDisplay(tank);
              const tankX = getTankX(tank.x);
              const healthPercent = (tank.health / tank.maxHealth) * 100;
              const healthColor = tank.side === 'left' ? '#4CAF50' : '#F44336';

              return (
                <div
                  key={tank.id}
                  style={{
                    position: 'absolute',
                    left: tankX,
                    bottom: 50, // выравнивание по низу (над землей)
                    transform: 'translateX(-50%)', // центрирование по X
                  }}
                >
                  {/* Индикатор здоровья */}
                  {showHealthBars && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -20,
                        left: 0,
                        width: '100%',
                        height: 6,
                        backgroundColor: '#333',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${healthPercent}%`,
                          height: '100%',
                          backgroundColor: healthColor,
                          transition: 'width 0.1s ease',
                        }}
                      />
                    </div>
                  )}

                  {/* Танк */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end', // выравнивание по низу
                      justifyContent: 'center',
                      transform: tank.side === 'right' ? 'scaleX(-1)' : 'none',
                    }}
                    title={`${tank.tankData.name || 'Танк'} | HP: ${Math.round(tank.health)}/${tank.maxHealth}`}
                  >
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={tank.tankData.name || 'Танк'}
                        style={{
                          display: 'block',
                          maxWidth: 'none',
                          height: 'auto',
                        }}
                        onLoad={(e) => {
                          // Сохраняем высоту изображения для расчета позиции пуль
                          const target = e.target as HTMLImageElement;
                          const height = target.naturalHeight || target.offsetHeight;
                          setTankHeights((prev) => {
                            const newMap = new Map(prev);
                            newMap.set(tank.id, height);
                            return newMap;
                          });
                        }}
                        onError={(e) => {
                          // Fallback если иконка не загрузилась
                          console.error('Failed to load tank icon:', iconUrl, tank.tankData.name);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div style="width: 40px; height: 30px; background: ${tank.side === 'left' ? '#4CAF50' : '#F44336'}; border: 2px solid #000; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${tank.isShooting ? '⚡' : '▣'}</div>`;
                            // Устанавливаем высоту для fallback
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
                          backgroundColor: tank.side === 'left' ? '#4CAF50' : '#F44336',
                          border: '2px solid #000',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                        }}
                      >
                        {tank.isShooting ? '⚡' : '▣'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Снаряды (вид сбоку) */}
            {gameState.projectiles.map((projectile: GameProjectile) => {
              // Находим танк, который выстрелил этот снаряд
              const shooter = gameState.tanks.find((t) => t.id === projectile.shooterId);
              // Получаем реальную высоту изображения танка
              const tankHeight = shooter ? (tankHeights.get(shooter.id) || 20) : 20;
              // Пули на уровне 2/3 от высоты изображения танка
              const bulletOffset = tankHeight * (2 / 3);
              
              return (
                <div
                  key={projectile.id}
                  style={{
                    position: 'absolute',
                    left: getTankX(projectile.x) - 4,
                    bottom: 50 + bulletOffset, // на уровне 2/3 от высоты изображения танка
                    width: 8,
                    height: 8,
                    backgroundColor: '#FFD700',
                    borderRadius: '50%',
                    border: '2px solid #FFA500',
                    boxShadow: '0 0 5px #FFD700',
                  }}
                />
              );
            })}

            {/* Линия середины */}
            <div
              style={{
                position: 'absolute',
                left: (MAP_WIDTH * SCALE) / 2 - 1,
                top: 0,
                width: 2,
                height: MAP_HEIGHT * SCALE,
                backgroundColor: '#999',
                opacity: 0.3,
                borderStyle: 'dashed',
              }}
            />
          </div>

          {/* Информация о танках */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3>Левые танки ({gameState.tanks.filter((t) => t.side === 'left').length})</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {gameState.tanks
                  .filter((t) => t.side === 'left')
                  .map((tank) => (
                    <div
                      key={tank.id}
                      style={{
                        padding: '5px',
                        margin: '2px 0',
                        backgroundColor: '#E8F5E9',
                        borderRadius: '4px',
                      }}
                    >
                      {tank.tankData.name || 'Танк'} | X: {Math.round(tank.x)} | HP:{' '}
                      {Math.round(tank.health)}/{tank.maxHealth}
                      {tank.isShooting && ' | ⚡ Стреляет'}
                    </div>
                  ))}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3>Правые танки ({gameState.tanks.filter((t) => t.side === 'right').length})</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {gameState.tanks
                  .filter((t) => t.side === 'right')
                  .map((tank) => (
                    <div
                      key={tank.id}
                      style={{
                        padding: '5px',
                        margin: '2px 0',
                        backgroundColor: '#FFEBEE',
                        borderRadius: '4px',
                      }}
                    >
                      {tank.tankData.name || 'Танк'} | X: {Math.round(tank.x)} | HP:{' '}
                      {Math.round(tank.health)}/{tank.maxHealth}
                      {tank.isShooting && ' | ⚡ Стреляет'}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Battle;

