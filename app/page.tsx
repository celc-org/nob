'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

interface Stop {
  name: string;
  lat: number;
  lng: number;
  type?: 'start' | 'finish';
}

const RoadMarchApp = () => {
  const [currentStop, setCurrentStop] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [totalDuration, setTotalDuration] = useState(0);
  const [locationDuration, setLocationDuration] = useState(0);
  const [locationTimes, setLocationTimes] = useState<Record<number, string>>(
    {}
  );
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const marchStartTimeRef = useRef<number | null>(null);
  const locationStartTimeRef = useRef<number | null>(null);

  const stops: Stop[] = [
    {
      name: 'Yakubu Gowon Stadium, Elekahia',
      lat: 4.8156,
      lng: 7.0498,
      type: 'start',
    },
    { name: 'Rumukalagbor', lat: 4.8234, lng: 7.0423 },
    { name: 'Nkpogu Roundabout', lat: 4.8312, lng: 7.0356 },
    { name: 'Garrison Junction', lat: 4.8389, lng: 7.0289 },
    { name: 'Isaac Boro Park (Aba Road)', lat: 4.8456, lng: 7.0234 },
    { name: 'Ikwerre Road by Mile One', lat: 4.8123, lng: 7.0167 },
    { name: 'Mile Two', lat: 4.8234, lng: 7.0089 },
    { name: 'Mile Three and Four', lat: 4.8345, lng: 7.0012 },
    { name: 'Rumuokwuta', lat: 4.8456, lng: 6.9945 },
    { name: 'Rumuigbo', lat: 4.8389, lng: 6.9878 },
    { name: 'Rumuokoro', lat: 4.8312, lng: 6.9823 },
    { name: 'Rukpoku', lat: 4.8234, lng: 6.9756 },
    { name: 'Eliozu', lat: 4.8156, lng: 6.9689 },
    { name: 'Tank', lat: 4.8089, lng: 6.9634 },
    { name: 'Rumukwurushi (Aba Road)', lat: 4.8012, lng: 6.9567 },
    { name: 'Air Force', lat: 4.8089, lng: 6.9489 },
    { name: 'Stadium Road', lat: 4.8156, lng: 6.9423 },
    { name: 'Yakubu Gowon Stadium', lat: 4.8156, lng: 7.0498, type: 'finish' },
  ];

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateDateTime();
    const dateInterval = setInterval(updateDateTime, 1000);

    return () => clearInterval(dateInterval);
  }, []);

  useEffect(() => {
    if (!hasStarted || hasEnded) return;

    const timerInterval = setInterval(() => {
      if (marchStartTimeRef.current && locationStartTimeRef.current) {
        const totalSecs = Math.floor(
          (Date.now() - marchStartTimeRef.current) / 1000
        );
        const locationSecs = Math.floor(
          (Date.now() - locationStartTimeRef.current) / 1000
        );
        setTotalDuration(totalSecs);
        setLocationDuration(locationSecs);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [hasStarted, hasEnded]);

  const startJourney = () => {
    setHasStarted(true);
    setHasEnded(false);
    marchStartTimeRef.current = Date.now();
    locationStartTimeRef.current = Date.now();
    setCurrentStop(1);
  };

  const previousStop = () => {
    if (currentStop > 1) {
      setCurrentStop(currentStop - 1);
      locationStartTimeRef.current = Date.now();
    }
  };

  const nextStop = () => {
    if (currentStop < stops.length - 1 && locationStartTimeRef.current) {
      const timeSpent = Math.floor(
        (Date.now() - locationStartTimeRef.current) / 1000
      );
      setLocationTimes((prev) => ({
        ...prev,
        [currentStop]: formatTime(timeSpent),
      }));

      if (currentStop === stops.length - 2) {
        setCurrentStop(currentStop + 1);
        setHasEnded(true);
        const finalTimeSpent = Math.floor(
          (Date.now() - locationStartTimeRef.current) / 1000
        );
        setLocationTimes((prev) => ({
          ...prev,
          [currentStop + 1]: formatTime(finalTimeSpent),
        }));
      } else {
        setCurrentStop(currentStop + 1);
        locationStartTimeRef.current = Date.now();
      }
    }
  };

  const resetProgress = () => {
    setCurrentStop(0);
    setHasStarted(false);
    setHasEnded(false);
    marchStartTimeRef.current = null;
    locationStartTimeRef.current = null;
    setLocationTimes({});
    setTotalDuration(0);
    setLocationDuration(0);
  };

  const toggleMapExpand = () => {
    if (window.innerWidth < 768) {
      // Mobile: toggle fullscreen
      setIsMapFullscreen(!isMapFullscreen);
    } else {
      // Desktop: toggle fullscreen
      setIsMapFullscreen(!isMapFullscreen);
    }
  };

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        minHeight: '100vh',
        paddingBottom: '90px',
      }}
    >
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #0f172a;
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(139, 92, 246, 0.1) 0%,
            rgba(139, 92, 246, 0.3) 50%,
            rgba(139, 92, 246, 0.1) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 3s linear infinite;
        }
        .fullscreen-map {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 9999 !important;
          margin: 0 !important;
          border-radius: 0 !important;
          padding: 0 !important;
        }
        .fullscreen-map-content {
          width: 100% !important;
          height: 100% !important;
        }
        @media (min-width: 768px) {
          .desktop-layout {
            grid-template-columns: 1fr 1fr !important;
          }
          .map-container-mobile {
            position: sticky !important;
            top: 100px !important;
            height: calc(100vh - 200px) !important;
            max-height: calc(100vh - 200px) !important;
          }
        }
        @media (max-width: 767px) {
          .map-container-mobile {
            position: sticky !important;
            top: 65px !important;
            z-index: 50 !important;
            transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
            will-change: height !important;
          }
          .map-container-mobile.expanded {
            height: 400px !important;
          }
          .map-container-mobile:not(.expanded) {
            height: 200px !important;
          }
        }
        .checkpoint-list {
          padding-bottom: 20px;
        }
      `}</style>

      {/* Sticky Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        <div
          style={{ maxWidth: '1400px', margin: '0 auto', padding: '8px 16px' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ flex: 1, minWidth: '150px' }}>
              <h1
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                  lineHeight: 1.2,
                  letterSpacing: '-0.3px',
                }}
              >
                Night of Bliss
              </h1>
              <p
                style={{
                  fontSize: '9px',
                  color: '#94a3b8',
                  margin: '2px 0 0 0',
                }}
              >
                {currentDate} • {currentTime}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '5px',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  padding: '3px 6px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <div
                  style={{
                    fontSize: '7px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                  }}
                >
                  Progress
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#8b5cf6',
                    marginTop: '1px',
                  }}
                >
                  {currentStop + 1}/{stops.length}
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '3px 6px',
                  background: 'rgba(236, 72, 153, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                }}
              >
                <div
                  style={{
                    fontSize: '7px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                  }}
                >
                  Total
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#ec4899',
                    fontFamily: 'monospace',
                    marginTop: '1px',
                  }}
                >
                  {formatTime(totalDuration)}
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '3px 6px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <div
                  style={{
                    fontSize: '7px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                  }}
                >
                  Location
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#3b82f6',
                    fontFamily: 'monospace',
                    marginTop: '1px',
                  }}
                >
                  {formatTime(locationDuration)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Map Overlay */}
      {isMapFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            background: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid rgba(139, 92, 246, 0.4)',
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#e2e8f0',
                margin: 0,
              }}
            >
              🗺️ Full Route Map
            </h2>
            <button
              onClick={toggleMapExpand}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: '2px solid rgba(239, 68, 68, 0.5)',
                transition: 'all 0.3s ease',
              }}
            >
              ✕ Close
            </button>
          </div>
          <div style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
            <MapComponent stops={stops} currentStop={currentStop} />
          </div>

          {/* Condensed Controls for Fullscreen */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(12px)',
              padding: '8px 16px',
              borderTop: '1px solid rgba(139, 92, 246, 0.3)',
              flexShrink: 0,
            }}
          >
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 50px',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={previousStop}
                  disabled={currentStop <= 1 || !hasStarted || hasEnded}
                  style={{
                    padding: '8px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor:
                      currentStop <= 1 || !hasStarted || hasEnded
                        ? 'not-allowed'
                        : 'pointer',
                    textTransform: 'uppercase',
                    background:
                      currentStop <= 1 || !hasStarted || hasEnded
                        ? 'rgba(71, 85, 105, 0.3)'
                        : 'linear-gradient(135deg, #475569, #334155)',
                    color:
                      currentStop <= 1 || !hasStarted || hasEnded
                        ? '#64748b'
                        : 'white',
                    letterSpacing: '0.3px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  ◀ Prev
                </button>
                <button
                  onClick={!hasStarted ? startJourney : nextStop}
                  disabled={hasEnded}
                  style={{
                    padding: '8px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: hasEnded ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase',
                    background: hasEnded
                      ? 'rgba(71, 85, 105, 0.3)'
                      : !hasStarted
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : currentStop === stops.length - 2
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    color: hasEnded ? '#64748b' : 'white',
                    letterSpacing: '0.3px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {!hasStarted
                    ? 'Start'
                    : currentStop === stops.length - 2
                    ? '🏁 End'
                    : 'Next ▶'}
                </button>
                <button
                  onClick={resetProgress}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '7px',
                    cursor: 'pointer',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: '#94a3b8',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                  }}
                >
                  🔄
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '20px',
          }}
          className="desktop-layout"
        >
          {/* Map Section */}
          <div
            className={`map-container-mobile ${
              isMapExpanded ? 'expanded' : ''
            }`}
            style={{
              background: 'rgba(30, 27, 75, 0.6)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '16px' }}>🗺️</span> Live Route
              </h2>
              <button
                onClick={toggleMapExpand}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                {isMapFullscreen
                  ? '✕ Close'
                  : window.innerWidth >= 768
                  ? '⛶ Fullscreen'
                  : isMapExpanded
                  ? '↓ Collapse'
                  : '↑ Expand'}
              </button>
            </div>
            <div
              style={{
                height: 'calc(100% - 50px)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <MapComponent stops={stops} currentStop={currentStop} />
            </div>
          </div>

          {/* Checkpoints Section */}
          <div
            style={{
              background: 'rgba(30, 27, 75, 0.6)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#e2e8f0',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '16px' }}>📍</span> Checkpoints
            </h2>
            <div
              className="checkpoint-list"
              style={{
                maxHeight: 'calc(100vh - 300px)',
                overflowY: 'auto',
                paddingRight: '8px',
              }}
            >
              {stops.map((stop, index) => {
                const status =
                  index < currentStop
                    ? 'completed'
                    : index === currentStop
                    ? 'current'
                    : 'upcoming';

                const isStartEnd = index === 0 || index === stops.length - 1;

                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '14px',
                      position: 'relative',
                    }}
                  >
                    {index < stops.length - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '16px',
                          top: '36px',
                          width: '2px',
                          height: 'calc(100% + 6px)',
                          background:
                            status === 'completed'
                              ? 'linear-gradient(180deg, #10b981, rgba(16, 185, 129, 0.3))'
                              : 'linear-gradient(180deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1))',
                        }}
                      ></div>
                    )}
                    <div
                      className={status === 'current' ? 'pulse-animation' : ''}
                      style={{
                        minWidth: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: isStartEnd ? '10px' : '13px',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 2,
                        background:
                          status === 'completed'
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : status === 'current'
                            ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                            : 'rgba(71, 85, 105, 0.5)',
                        color: status === 'upcoming' ? '#64748b' : 'white',
                        boxShadow:
                          status === 'completed'
                            ? '0 4px 16px rgba(16, 185, 129, 0.5)'
                            : status === 'current'
                            ? '0 4px 20px rgba(139, 92, 246, 0.6)'
                            : 'none',
                        border:
                          status === 'current'
                            ? '2px solid rgba(139, 92, 246, 0.5)'
                            : 'none',
                      }}
                    >
                      {status === 'completed'
                        ? '✓'
                        : isStartEnd
                        ? index === 0
                          ? '1\n(Start)'
                          : '18\n(End)'
                        : index + 1}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        marginLeft: '12px',
                        background:
                          status === 'current'
                            ? 'rgba(139, 92, 246, 0.15)'
                            : 'rgba(30, 41, 59, 0.4)',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border:
                          status === 'current'
                            ? '2px solid rgba(139, 92, 246, 0.5)'
                            : '1px solid rgba(71, 85, 105, 0.3)',
                        transition: 'all 0.3s ease',
                      }}
                      className={status === 'current' ? 'shimmer' : ''}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: '#e2e8f0',
                          fontSize: '13px',
                          marginBottom: '4px',
                        }}
                      >
                        {stop.name}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '5px',
                          marginTop: '5px',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}
                      >
                        {isStartEnd && (
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              background:
                                index === 0
                                  ? 'linear-gradient(135deg, #10b981, #059669)'
                                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              color: 'white',
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            {index === 0 ? '🏁 Start' : '🏆 End'}
                          </span>
                        )}
                        {status === 'current' && (
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              background:
                                'linear-gradient(135deg, #8b5cf6, #ec4899)',
                              color: 'white',
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            📍 Current
                          </span>
                        )}
                      </div>
                      {locationTimes[index] && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#94a3b8',
                            marginTop: '6px',
                            fontFamily: 'monospace',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: 600,
                          }}
                        >
                          ⏱️ {locationTimes[index]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Controls */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(12px)',
          padding: '12px 16px',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.5)',
          zIndex: 101,
          borderTop: '1px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 60px',
              gap: '10px',
            }}
          >
            <button
              onClick={previousStop}
              disabled={currentStop <= 1 || !hasStarted || hasEnded}
              style={{
                padding: '12px',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '12px',
                cursor:
                  currentStop <= 1 || !hasStarted || hasEnded
                    ? 'not-allowed'
                    : 'pointer',
                textTransform: 'uppercase',
                background:
                  currentStop <= 1 || !hasStarted || hasEnded
                    ? 'rgba(71, 85, 105, 0.3)'
                    : 'linear-gradient(135deg, #475569, #334155)',
                color:
                  currentStop <= 1 || !hasStarted || hasEnded
                    ? '#64748b'
                    : 'white',
                letterSpacing: '0.5px',
                boxShadow:
                  currentStop <= 1 || !hasStarted || hasEnded
                    ? 'none'
                    : '0 4px 16px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
              }}
            >
              ◀ Previous
            </button>
            <button
              onClick={!hasStarted ? startJourney : nextStop}
              disabled={hasEnded}
              style={{
                padding: '12px',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: hasEnded ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                background: hasEnded
                  ? 'rgba(71, 85, 105, 0.3)'
                  : !hasStarted
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : currentStop === stops.length - 2
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                color: hasEnded ? '#64748b' : 'white',
                letterSpacing: '0.5px',
                boxShadow: hasEnded
                  ? 'none'
                  : !hasStarted
                  ? '0 4px 20px rgba(16, 185, 129, 0.5)'
                  : currentStop === stops.length - 2
                  ? '0 4px 20px rgba(239, 68, 68, 0.5)'
                  : '0 4px 20px rgba(139, 92, 246, 0.5)',
                transition: 'all 0.3s ease',
              }}
            >
              {!hasStarted
                ? 'Start'
                : currentStop === stops.length - 2
                ? '🏁 End'
                : 'Next ▶'}
            </button>
            <button
              onClick={resetProgress}
              style={{
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '8px',
                cursor: 'pointer',
                background: 'rgba(30, 41, 59, 0.6)',
                color: '#94a3b8',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(71, 85, 105, 0.3)',
              }}
            >
              🔄RESET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadMarchApp;
