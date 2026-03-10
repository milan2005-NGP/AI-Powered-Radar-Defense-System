import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Target, Radio, Shield, Clock, MapPin, Activity, Zap, Users, Eye, Brain, Send, Loader } from 'lucide-react';
import { LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';

const RadarMissileDetectionDashboard = () => {
  const [threats, setThreats] = useState([]);
  const [systemStatus, setSystemStatus] = useState('OPERATIONAL');
  const [scanAngle, setScanAngle] = useState(0);
  const [alertLevel, setAlertLevel] = useState('GREEN');
  const [aiMessages, setAiMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);
  const [time, setTime] = useState(new Date());

  // Initialize storage and load data
  useEffect(() => {
    loadThreats();
    loadAiMessages();
    const interval = setInterval(() => {
      setTime(new Date());
      setScanAngle(prev => (prev + 2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const loadThreats = async () => {
    try {
      const result = await window.storage.get('radar-threats', false);
      if (result) {
        setThreats(JSON.parse(result.value));
      }
    } catch (error) {
      setThreats([]);
    }
  };

  const saveThreats = async (newThreats) => {
    try {
      await window.storage.set('radar-threats', JSON.stringify(newThreats), false);
    } catch (error) {
      console.error('Failed to save threats:', error);
    }
  };

  const loadAiMessages = async () => {
    try {
      const result = await window.storage.get('ai-messages', false);
      if (result) {
        setAiMessages(JSON.parse(result.value));
      } else {
        const welcomeMsg = {
          role: 'assistant',
          content: '🛡️ **Defense AI System Online**\n\nI am your AI defense analyst. I can help you:\n\n• Analyze incoming threats and predict trajectories\n• Recommend defensive countermeasures\n• Assess threat severity and impact zones\n• Coordinate multi-threat scenarios\n• Provide strategic defense insights\n\nAsk me anything about the current threats or request a full tactical assessment.',
          timestamp: new Date().toISOString()
        };
        setAiMessages([welcomeMsg]);
        await window.storage.set('ai-messages', JSON.stringify([welcomeMsg]), false);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const saveAiMessages = async (messages) => {
    try {
      await window.storage.set('ai-messages', JSON.stringify(messages), false);
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  };

  // Simulate threat detection
  const detectNewThreat = () => {
    const threatTypes = ['BALLISTIC MISSILE', 'CRUISE MISSILE', 'FIGHTER JET', 'DRONE', 'UNKNOWN OBJECT'];
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    
    const newThreat = {
      id: Date.now(),
      type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      distance: Math.floor(Math.random() * 500) + 50,
      speed: Math.floor(Math.random() * 2000) + 300,
      altitude: Math.floor(Math.random() * 15000) + 1000,
      bearing: Math.floor(Math.random() * 360),
      eta: Math.floor(Math.random() * 600) + 60,
      detected: new Date().toISOString(),
      status: 'TRACKING'
    };

    const updatedThreats = [...threats, newThreat];
    setThreats(updatedThreats);
    saveThreats(updatedThreats);
    
    // Update alert level
    if (newThreat.severity === 'CRITICAL') setAlertLevel('RED');
    else if (newThreat.severity === 'HIGH' && alertLevel !== 'RED') setAlertLevel('ORANGE');

    // AI auto-analysis for critical threats
    if (newThreat.severity === 'CRITICAL') {
      setTimeout(() => {
        sendAiMessage(`⚠️ CRITICAL THREAT AUTO-ANALYSIS: A ${newThreat.type} has been detected at ${newThreat.distance}km. Provide immediate tactical assessment and recommended countermeasures.`);
      }, 1000);
    }
  };

  const neutralizeThreat = (id) => {
    const updatedThreats = threats.map(t => 
      t.id === id ? { ...t, status: 'NEUTRALIZED' } : t
    );
    setThreats(updatedThreats);
    saveThreats(updatedThreats);
  };

  const clearAllThreats = async () => {
    setThreats([]);
    setAlertLevel('GREEN');
    try {
      await window.storage.delete('radar-threats', false);
    } catch (error) {
      console.error('Failed to clear threats:', error);
    }
  };

  const sendAiMessage = async (customMessage = null) => {
    const messageToSend = customMessage || userInput.trim();
    if (!messageToSend) return;

    const userMessage = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...aiMessages, userMessage];
    setAiMessages(updatedMessages);
    saveAiMessages(updatedMessages);
    setUserInput('');
    setIsAiThinking(true);

    try {
      // Prepare context for AI
      const activeThreatsList = threats.filter(t => t.status === 'TRACKING');
      const threatContext = activeThreatsList.map(t => 
        `- ${t.type}: Distance ${t.distance}km, Speed ${t.speed}km/h, Altitude ${t.altitude}m, Bearing ${t.bearing}°, ETA ${Math.floor(t.eta/60)}m ${t.eta%60}s, Severity ${t.severity}`
      ).join('\n');

      const systemPrompt = `You are an elite military AI defense analyst for a radar missile detection system. Your role is to provide tactical assessments, threat analysis, and strategic recommendations.

Current System Status:
- Alert Level: ${alertLevel}
- Active Threats: ${activeThreatsList.length}
- System Status: ${systemStatus}

Active Threats Detected:
${threatContext || 'No active threats detected'}

Provide clear, actionable military-style responses. Be concise but thorough. Use military terminology and tactical language. Format your responses with clear sections when appropriate.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...updatedMessages.slice(-5).map(m => ({
              role: m.role,
              content: m.content
            }))
          ]
        })
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const data = await response.json();
      const aiResponse = data.content.find(c => c.type === 'text')?.text || 'Unable to generate response.';

      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setAiMessages(finalMessages);
      saveAiMessages(finalMessages);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: '⚠️ **System Error**: Unable to connect to AI defense network. Please check your connection and try again.',
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setAiMessages(finalMessages);
      saveAiMessages(finalMessages);
    } finally {
      setIsAiThinking(false);
    }
  };

  const quickActions = [
    { label: 'Tactical Assessment', prompt: 'Provide a complete tactical assessment of all active threats with priority rankings and recommended response strategies.' },
    { label: 'Threat Analysis', prompt: 'Analyze the current threat patterns and predict potential attack corridors or coordinated strike scenarios.' },
    { label: 'Defense Recommendations', prompt: 'What defensive countermeasures should we deploy based on current threat levels and available resources?' },
    { label: 'Impact Prediction', prompt: 'Calculate probable impact zones and civilian evacuation priorities based on current threat trajectories.' }
  ];

  // Draw radar display
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1a3a2a';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1a3a2a';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - maxRadius);
    ctx.lineTo(centerX, centerY + maxRadius);
    ctx.moveTo(centerX - maxRadius, centerY);
    ctx.lineTo(centerX + maxRadius, centerY);
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((scanAngle * Math.PI) / 180);
    
    const gradient = ctx.createLinearGradient(0, 0, maxRadius, 0);
    gradient.addColorStop(0, 'rgba(0, 255, 100, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 100, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 100, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxRadius, -Math.PI / 6, Math.PI / 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    threats.filter(t => t.status === 'TRACKING').forEach(threat => {
      const angle = (threat.bearing * Math.PI) / 180;
      const distance = (threat.distance / 500) * maxRadius;
      const x = centerX + Math.cos(angle - Math.PI / 2) * distance;
      const y = centerY + Math.sin(angle - Math.PI / 2) * distance;

      const color = threat.severity === 'CRITICAL' ? '#ff0000' : 
                    threat.severity === 'HIGH' ? '#ff6b00' :
                    threat.severity === 'MEDIUM' ? '#ffaa00' : '#ffff00';

      ctx.fillStyle = color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 1;
      for (let r = 10; r <= 30; r += 10) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.fillStyle = '#00ff64';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ['125km', '250km', '375km', '500km'].forEach((label, i) => {
      ctx.fillText(label, centerX, centerY - ((maxRadius / 4) * (i + 1)) + 4);
    });

  }, [scanAngle, threats]);

  const activeThreatCount = threats.filter(t => t.status === 'TRACKING').length;
  const neutralizedCount = threats.filter(t => t.status === 'NEUTRALIZED').length;

  const radarData = [
    { sector: 'N', threats: threats.filter(t => t.bearing >= 315 || t.bearing < 45).length },
    { sector: 'NE', threats: threats.filter(t => t.bearing >= 45 && t.bearing < 90).length },
    { sector: 'E', threats: threats.filter(t => t.bearing >= 90 && t.bearing < 135).length },
    { sector: 'SE', threats: threats.filter(t => t.bearing >= 135 && t.bearing < 180).length },
    { sector: 'S', threats: threats.filter(t => t.bearing >= 180 && t.bearing < 225).length },
    { sector: 'SW', threats: threats.filter(t => t.bearing >= 225 && t.bearing < 270).length },
    { sector: 'W', threats: threats.filter(t => t.bearing >= 270 && t.bearing < 315).length },
  ];

  const timeSeriesData = threats.slice(-10).map((t, i) => ({
    time: i + 1,
    threats: threats.slice(0, i + 1).filter(th => th.status === 'TRACKING').length
  }));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e14 0%, #1a1f2e 50%, #0f1419 100%)',
      color: '#00ff64',
      fontFamily: '"Orbitron", "Courier New", monospace',
      padding: '20px',
      overflow: 'auto'
    }}>
      {/* Top Alert Bar */}
      <div style={{
        background: alertLevel === 'RED' ? 'linear-gradient(90deg, #8b0000 0%, #ff0000 50%, #8b0000 100%)' :
                    alertLevel === 'ORANGE' ? 'linear-gradient(90deg, #8b4500 0%, #ff6b00 50%, #8b4500 100%)' :
                    'linear-gradient(90deg, #003300 0%, #006600 50%, #003300 100%)',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '2px solid ' + (alertLevel === 'RED' ? '#ff0000' : alertLevel === 'ORANGE' ? '#ff6b00' : '#00ff64'),
        boxShadow: '0 0 30px ' + (alertLevel === 'RED' ? '#ff000050' : alertLevel === 'ORANGE' ? '#ff6b0050' : '#00ff6450'),
        animation: alertLevel !== 'GREEN' ? 'pulse 2s infinite' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Shield size={32} />
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>
              AI DEFENSE SYSTEM
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              THREAT LEVEL: {alertLevel} • {time.toLocaleTimeString()} • AI AGENT: ACTIVE
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={detectNewThreat} style={{
            background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
            border: '2px solid #ff6666',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 20px #ff444450'
          }}>
            <Target size={18} />
            SIMULATE THREAT
          </button>
          <button onClick={clearAllThreats} style={{
            background: 'linear-gradient(135deg, #333 0%, #111 100%)',
            border: '2px solid #555',
            color: '#00ff64',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            CLEAR ALL
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        {[
          { icon: AlertTriangle, label: 'Active Threats', value: activeThreatCount, color: '#ff4444' },
          { icon: Shield, label: 'Neutralized', value: neutralizedCount, color: '#00ff64' },
          { icon: Brain, label: 'AI Status', value: 'ONLINE', color: '#00aaff' },
          { icon: Activity, label: 'Scan Rate', value: '120 RPM', color: '#ffaa00' }
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
            border: '2px solid #2a3f4f',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 0 20px rgba(0,255,100,0.1)',
            transition: 'transform 0.3s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <stat.icon size={24} color={stat.color} />
              <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {stat.label}
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Left Column - Radar and Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Radar Display */}
          <div style={{
            background: 'linear-gradient(135deg, #0d1117 0%, #151b23 100%)',
            border: '3px solid #00ff64',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 0 40px rgba(0,255,100,0.3)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px',
              borderBottom: '2px solid #2a3f4f',
              paddingBottom: '10px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
                <Eye size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                RADAR SCOPE
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                500KM RANGE
              </div>
            </div>
            <canvas 
              ref={canvasRef} 
              width={500} 
              height={500}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* Sector Analysis */}
          <div style={{
            background: 'linear-gradient(135deg, #0d1117 0%, #151b23 100%)',
            border: '3px solid #00ff64',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 0 40px rgba(0,255,100,0.3)'
          }}>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              letterSpacing: '2px',
              marginBottom: '15px',
              borderBottom: '2px solid #2a3f4f',
              paddingBottom: '10px'
            }}>
              <Target size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              SECTOR ANALYSIS
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2a3f4f" />
                <PolarAngleAxis dataKey="sector" stroke="#00ff64" />
                <PolarRadiusAxis stroke="#00ff64" />
                <RechartsRadar name="Threats" dataKey="threats" stroke="#ff4444" fill="#ff4444" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - AI Assistant */}
        <div style={{
          background: 'linear-gradient(135deg, #0d1117 0%, #151b23 100%)',
          border: '3px solid #00aaff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 0 40px rgba(0,170,255,0.3)',
          display: 'flex',
          flexDirection: 'column',
          height: '800px'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            letterSpacing: '2px',
            marginBottom: '15px',
            borderBottom: '2px solid #2a3f4f',
            paddingBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Brain size={24} color="#00aaff" />
            <span>AI DEFENSE ANALYST</span>
            <div style={{
              marginLeft: 'auto',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#00ff64',
              boxShadow: '0 0 10px #00ff64',
              animation: 'pulse 2s infinite'
            }} />
          </div>

          {/* Quick Actions */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            marginBottom: '15px'
          }}>
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => sendAiMessage(action.prompt)}
                disabled={isAiThinking}
                style={{
                  background: 'linear-gradient(135deg, #1a3a4f 0%, #0f1f2f 100%)',
                  border: '1px solid #2a5f7f',
                  color: '#00aaff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: isAiThinking ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  opacity: isAiThinking ? 0.5 : 1,
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => !isAiThinking && (e.currentTarget.style.background = 'linear-gradient(135deg, #2a4a5f 0%, #1f2f3f 100%)')}
                onMouseLeave={(e) => !isAiThinking && (e.currentTarget.style.background = 'linear-gradient(135deg, #1a3a4f 0%, #0f1f2f 100%)')}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '15px',
            padding: '10px',
            background: '#0a0e14',
            borderRadius: '8px',
            border: '1px solid #2a3f4f'
          }}>
            {aiMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '15px',
                  padding: '12px',
                  background: msg.role === 'user' 
                    ? 'linear-gradient(135deg, #1a2a3a 0%, #0f1a2a 100%)'
                    : 'linear-gradient(135deg, #1a3a2a 0%, #0f1f1a 100%)',
                  border: '1px solid ' + (msg.role === 'user' ? '#2a5f7f' : '#2a7f5f'),
                  borderRadius: '8px',
                  borderLeft: '4px solid ' + (msg.role === 'user' ? '#00aaff' : '#00ff64')
                }}
              >
                <div style={{
                  fontSize: '10px',
                  opacity: 0.7,
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {msg.role === 'user' ? <Users size={12} /> : <Brain size={12} />}
                  {msg.role === 'user' ? 'OPERATOR' : 'AI ANALYST'}
                  <span style={{ marginLeft: 'auto' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{
                  fontSize: '12px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #1a3a2a 0%, #0f1f1a 100%)',
                border: '1px solid #2a7f5f',
                borderRadius: '8px',
                borderLeft: '4px solid #00ff64',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '12px' }}>AI analyzing threat data...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isAiThinking && sendAiMessage()}
              placeholder="Ask AI for threat analysis..."
              disabled={isAiThinking}
              style={{
                flex: 1,
                background: '#0a0e14',
                border: '2px solid #2a3f4f',
                borderRadius: '6px',
                padding: '12px',
                color: '#00ff64',
                fontFamily: 'inherit',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => sendAiMessage()}
              disabled={isAiThinking || !userInput.trim()}
              style={{
                background: isAiThinking || !userInput.trim() 
                  ? 'linear-gradient(135deg, #333 0%, #111 100%)'
                  : 'linear-gradient(135deg, #00aaff 0%, #0088cc 100%)',
                border: 'none',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: isAiThinking || !userInput.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isAiThinking || !userInput.trim() ? 'none' : '0 0 20px #00aaff50',
                opacity: isAiThinking || !userInput.trim() ? 0.5 : 1
              }}
            >
              {isAiThinking ? <Loader size={18} /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Active Threats List */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #151b23 100%)',
        border: '3px solid #00ff64',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 0 40px rgba(0,255,100,0.3)'
      }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          letterSpacing: '2px',
          marginBottom: '15px',
          borderBottom: '2px solid #2a3f4f',
          paddingBottom: '10px'
        }}>
          <Zap size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          ACTIVE THREATS ({activeThreatCount})
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {threats.filter(t => t.status === 'TRACKING').length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              opacity: 0.5,
              fontSize: '14px'
            }}>
              NO ACTIVE THREATS DETECTED<br/>
              <span style={{ fontSize: '12px' }}>AIRSPACE CLEAR</span>
            </div>
          ) : (
            threats.filter(t => t.status === 'TRACKING').map(threat => (
              <div key={threat.id} style={{
                background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
                border: '2px solid ' + (threat.severity === 'CRITICAL' ? '#ff0000' : 
                                        threat.severity === 'HIGH' ? '#ff6b00' :
                                        threat.severity === 'MEDIUM' ? '#ffaa00' : '#ffff00'),
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '10px',
                boxShadow: '0 0 15px ' + (threat.severity === 'CRITICAL' ? '#ff000030' : 
                                          threat.severity === 'HIGH' ? '#ff6b0030' :
                                          threat.severity === 'MEDIUM' ? '#ffaa0030' : '#ffff0030')
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{
                        background: threat.severity === 'CRITICAL' ? '#ff0000' : 
                                   threat.severity === 'HIGH' ? '#ff6b00' :
                                   threat.severity === 'MEDIUM' ? '#ffaa00' : '#ffff00',
                        color: '#000',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        letterSpacing: '1px'
                      }}>
                        {threat.severity}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {threat.type}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '10px',
                      fontSize: '12px',
                      opacity: 0.9
                    }}>
                      <div>
                        <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Distance: {threat.distance}km
                      </div>
                      <div>
                        <Zap size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Speed: {threat.speed}km/h
                      </div>
                      <div>
                        <Activity size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Altitude: {threat.altitude}m
                      </div>
                      <div>
                        <Target size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Bearing: {threat.bearing}°
                      </div>
                      <div>
                        <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        ETA: {Math.floor(threat.eta / 60)}m {threat.eta % 60}s
                      </div>
                      <div>
                        ID: #{threat.id.toString().slice(-6)}
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => neutralizeThreat(threat.id)} style={{
                    background: 'linear-gradient(135deg, #00ff64 0%, #00aa44 100%)',
                    border: 'none',
                    color: '#000',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    boxShadow: '0 0 15px #00ff6450'
                  }}>
                    NEUTRALIZE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #00ff64 #0a0e14;
        }
        
        *::-webkit-scrollbar {
          width: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: #0a0e14;
        }
        
        *::-webkit-scrollbar-thumb {
          background: #00ff64;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default RadarMissileDetectionDashboard;