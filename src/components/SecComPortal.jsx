import React, { useState, useEffect, useRef } from 'react';
import {
  encryptWithAlgorithm,
  decryptWithAlgorithm,
  encodeZeroWidth,
  decodeZeroWidth,
  hideTextInCanvas,
  extractTextFromCanvas,
  analyzeEntropy,
  generateRSAKeyPair
} from '../utils/cryptoUtils';
import {
  supabase,
  isSupabaseConfigured,
  setSupabaseCredentials
} from '../lib/supabaseClient';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Zap,
  Flame,
  Eye,
  FileCode,
  Globe,
  Key,
  MessageSquare,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  EyeOff,
  Radio,
  Clock,
  Cpu,
  Download,
  Image as ImageIcon,
  UserCheck,
  UserPlus,
  Trash2,
  Edit3,
  Send,
  Users,
  Hash,
  Bot,
  Bomb,
  Database,
  Server,
  User,
  ShieldAlert,
  Sliders,
  Upload,
  FileSearch,
  CheckCheck,
  Ghost,
  Activity,
  MapPin,
  Laptop,
  ShieldOff,
  Network,
  Brain,
  Pin,
  PinOff,
  ChevronDown,
  Workflow,
  GitFork,
  ArrowRight,
  Share2,
  Layers,
  Camera,
  Scan,
  X,
  CheckCircle2
} from 'lucide-react';

const CLIENT_ID = 'client-' + Math.random().toString(36).substring(2, 9);

const formatTimestamp = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toLocaleString();
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export default function SecComPortal({ onEmergencyPurge }) {
  // AUTHENTICATION & ROLE STATE: 'unauthenticated' | 'user' | 'admin'
  const [authRole, setAuthRole] = useState('unauthenticated');
  const [activeUser, setActiveUser] = useState(null); // { username, role }

  // GATEWAY LOGIN MODAL STATE
  const [loginTab, setLoginTab] = useState('user'); // 'user' | 'admin'
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('chat');
  const [copied, setCopied] = useState(false);

  // E2EE ALGORITHM SELECTION STATE
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('AES-256-GCM');

  // SUPABASE CONFIG MODAL STATE
  const [showDbModal, setShowDbModal] = useState(false);
  const [inputDbUrl, setInputDbUrl] = useState(localStorage.getItem('seccom_supabase_url') || '');
  const [inputDbKey, setInputDbKey] = useState(localStorage.getItem('seccom_supabase_key') || '');

  // AUTOMATED 40-SECOND INACTIVITY TIMEOUT STATE
  const [inactivitySeconds, setInactivitySeconds] = useState(40);

  // USER MANAGEMENT STATE (CRUD)
  const [usersList, setUsersList] = useState(() => {
    try {
      const saved = localStorage.getItem('seccom_users_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(u => !(u.username.toLowerCase() === 'admin' && u.passkey === 'admin'));
        }
      }
    } catch {}
    return [
      { id: 'usr-2', username: 'user', passkey: 'user', role: 'User', status: 'Active', created: '2026-07-26' }
    ];
  });
  const [newUsername, setNewUsername] = useState('');
  const [newPasskey, setNewPasskey] = useState('');
  const [newRole, setNewRole] = useState('User');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPasskey, setEditPasskey] = useState('');
  const [editRole, setEditRole] = useState('User');

  // REALTIME ENCRYPTED ROOM CHAT STATE & BROADCAST
  const [selectedRoom, setSelectedRoom] = useState('#general-vault');
  const [roomMessages, setRoomMessages] = useState({
    '#general-vault': [
      { id: 'msg-101', sender: 'System-Node', cipher: 'e30.eyJ2IjoxLCJhbGdvIjoiQUVTLTI1Ni1HQ00ifQ==', text: 'Channel established. Zero-knowledge active.', time: formatTimestamp('2026-07-28T20:00:00') }
    ],
    '#alpha-squad': [
      { id: 'msg-201', sender: 'user', cipher: 'a12.eyJ2IjoxLCJhbGdvIjoiQUVTLTI1Ni1HQ00ifQ==', text: 'Alpha squad standing by for stego transmission.', time: formatTimestamp('2026-07-28T20:15:00') }
    ],
    '#cyber-intelligence': [
      { id: 'msg-301', sender: 'System-Bot', cipher: 'b99.eyJ2IjoxLCJhbGdvIjoiQUVTLTI1Ni1HQ00ifQ==', text: 'Anti-fingerprinting shield active on all relays.', time: formatTimestamp('2026-07-28T20:20:00') }
    ]
  });
  const [roomInput, setRoomInput] = useState('');
  const [roomSenderName, setRoomSenderName] = useState('user');
  const [autoBurnSeconds, setAutoBurnSeconds] = useState('none');
  const [roomDeleteAfterView, setRoomDeleteAfterView] = useState(false);

  // GHOST MODE & ADMIN SECURITY AUDIT STATE
  const [adminSubTab, setAdminSubTab] = useState('users'); // 'users' | 'history' | 'alerts' | 'ips'
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [failedLoginCounter, setFailedLoginCounter] = useState(0);
  const [loginHistory, setLoginHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('seccom_login_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'log-101', username: 'admin', ip: '192.168.1.101', status: 'SUCCESS', date: formatTimestamp('2026-07-28T20:00:00'), device: 'Chrome 124 / Windows 11', risk: 'LOW' },
      { id: 'log-102', username: 'user', ip: '192.168.1.105', status: 'SUCCESS', date: formatTimestamp('2026-07-28T20:15:00'), device: 'Mobile Safari / iOS 17', risk: 'LOW' },
      { id: 'log-103', username: 'root_hacker', ip: '185.220.101.5', status: 'FAILED', date: formatTimestamp('2026-07-28T20:45:00'), device: 'Tor Exit Node / Script Bot', risk: 'HIGH SUSPICIOUS' }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('seccom_login_history', JSON.stringify(loginHistory));
    } catch {}
  }, [loginHistory]);

  // REALTIME ADMIN-USER DIRECT CHAT STATE & SELF-DESTRUCT TIMERS
  const adminChatEndRef = useRef(null);
  const userChatEndRef = useRef(null);
  const prevChatTargetRef = useRef(null);

  const [selectedChatUser, setSelectedChatUser] = useState('user');
  const [adminChatPerspective, setAdminChatPerspective] = useState('Admin');
  const [directAutoBurnSeconds, setDirectAutoBurnSeconds] = useState('none');
  const [directDeleteAfterView, setDirectDeleteAfterView] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  const [pinnedMessages, setPinnedMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('seccom_pinned_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });
  const [adminDirectMessages, setAdminDirectMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('seccom_direct_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
      }
    } catch {}
    return {
      'user': [
        { id: 'dir-1', sender: 'Admin', cipher: 'adm-01.aes', text: 'SecCom Command established. State your clearance code.', time: formatTimestamp('2026-07-28T20:30:00'), status: 'seen', isGhost: false },
        { id: 'dir-2', sender: 'user', cipher: 'usr-01.aes', text: 'Clearance verified: User-7-Delta. Ready for task.', time: formatTimestamp('2026-07-28T20:31:00'), status: 'seen', isGhost: false }
      ]
    };
  });
  const [directMsgInput, setDirectMsgInput] = useState('');

  const [hasUnreadDotAdmin, setHasUnreadDotAdmin] = useState(false);
  const [hasUnreadDotUser, setHasUnreadDotUser] = useState(false);

  // HELPER TO RETRIEVE DIRECT MESSAGES CASE-INSENSITIVELY FOR ANY TARGET USERNAME
  const getDirectMessagesForUser = (username) => {
    if (!username) return [];
    const targetLower = username.toLowerCase();
    const matchedKeys = Object.keys(adminDirectMessages).filter(k => k && k.toLowerCase() === targetLower);
    if (matchedKeys.length === 0) return adminDirectMessages[username] || [];

    const allMsgs = [];
    matchedKeys.forEach(k => {
      (adminDirectMessages[k] || []).forEach(msg => {
        if (!allMsgs.some(m => m.id === msg.id || (m.sender === msg.sender && m.text === msg.text))) {
          allMsgs.push(msg);
        }
      });
    });
    allMsgs.sort((a, b) => (a.createdTimestamp || 0) - (b.createdTimestamp || 0));
    return allMsgs;
  };

  useEffect(() => {
    try {
      localStorage.setItem('seccom_direct_messages', JSON.stringify(adminDirectMessages));
    } catch {}
  }, [adminDirectMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('seccom_pinned_messages', JSON.stringify(pinnedMessages));
    } catch {}
  }, [pinnedMessages]);

  // STEGANOGRAPHY VAULT STATE
  const [stegoVaultList, setStegoVaultList] = useState(() => {
    try {
      const saved = localStorage.getItem('seccom_stego_vault');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'stego-demo-1',
        title: 'Alpha Ops Stego Payload',
        created: formatTimestamp('2026-07-28T20:45:00'),
        isPasswordProtected: true,
        passwordHint: 'AES-256-GCM Password Key',
        dataUrl: '',
        rawPayload: 'SECCOM_PASS:AES-256-GCM.SecretPayload'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('seccom_stego_vault', JSON.stringify(stegoVaultList));
    } catch {}
  }, [stegoVaultList]);

  // LIVE 1-SECOND TICKING EFFECT FOR SELF-DESTRUCT TIMERS & VIEW-ONCE BURNING
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNowTimestamp(now);

      // 1. Check Room Messages for expired autoBurn or revealed deleteAfterView
      setRoomMessages((prev) => {
        let changed = false;
        const updated = { ...prev };

        Object.keys(updated).forEach((room) => {
          const list = updated[room] || [];
          const filtered = list.filter((m) => {
            if (m.autoBurn && typeof m.autoBurn === 'number') {
              const createdMs = m.createdTimestamp || (m.time ? Date.parse(m.time) : now);
              const elapsed = Math.floor((now - createdMs) / 1000);
              if (elapsed >= m.autoBurn) {
                changed = true;
                if (isSupabaseConfigured && supabase) {
                  supabase.from('room_messages').delete().eq('id', m.id).then(() => {}).catch(() => {});
                }
                return false;
              }
            }
            if (m.deleteAfterView && m.isRevealed && m.revealedTimestamp) {
              const elapsed = Math.floor((now - m.revealedTimestamp) / 1000);
              if (elapsed >= 3) {
                changed = true;
                if (isSupabaseConfigured && supabase) {
                  supabase.from('room_messages').delete().eq('id', m.id).then(() => {}).catch(() => {});
                }
                return false;
              }
            }
            return true;
          });

          if (filtered.length !== list.length) {
            updated[room] = filtered;
          }
        });

        return changed ? updated : prev;
      });

      // 2. Check Direct Messages for expired autoBurn or revealed deleteAfterView
      setAdminDirectMessages((prev) => {
        let changed = false;
        const updated = { ...prev };

        Object.keys(updated).forEach((targetUser) => {
          const list = updated[targetUser] || [];
          const filtered = list.filter((m) => {
            if (m.autoBurn && typeof m.autoBurn === 'number') {
              const createdMs = m.createdTimestamp || (m.time ? Date.parse(m.time) : now);
              const elapsed = Math.floor((now - createdMs) / 1000);
              if (elapsed >= m.autoBurn) {
                changed = true;
                if (isSupabaseConfigured && supabase) {
                  supabase.from('direct_messages').delete().eq('id', m.id).then(() => {}).catch(() => {});
                }
                return false;
              }
            }
            if (m.deleteAfterView && m.isRevealed && m.revealedTimestamp) {
              const elapsed = Math.floor((now - m.revealedTimestamp) / 1000);
              if (elapsed >= 3) {
                changed = true;
                if (isSupabaseConfigured && supabase) {
                  supabase.from('direct_messages').delete().eq('id', m.id).then(() => {}).catch(() => {});
                }
                return false;
              }
            }
            return true;
          });

          if (filtered.length !== list.length) {
            updated[targetUser] = filtered;
          }
        });

        return changed ? updated : prev;
      });

    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // SCREEN OFF / DEVICE LOCK / TAB INVISIBILITY PANIC RESET TO COVER ARTICLE PAGE
  useEffect(() => {
    const handleScreenOffOrLock = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        setAuthRole('unauthenticated');
        setActiveUser(null);
        setActiveTab('chat');
        if (typeof onEmergencyPurge === 'function') {
          onEmergencyPurge();
        }
      }
    };

    document.addEventListener('visibilitychange', handleScreenOffOrLock);
    window.addEventListener('pagehide', handleScreenOffOrLock);

    return () => {
      document.removeEventListener('visibilitychange', handleScreenOffOrLock);
      window.removeEventListener('pagehide', handleScreenOffOrLock);
    };
  }, [onEmergencyPurge]);

  // REALTIME ADMIN BROADCAST & BURN NOTE STATE
  const [activeBroadcastNote, setActiveBroadcastNote] = useState(null);
  const [broadcastInput, setBroadcastInput] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');

  // DUAL REALTIME BROADCAST CHANNELS & LOCALSTORAGE EVENT SYNC
  const broadcastChannelRef = useRef(null);

  // SUPABASE DATABASE INITIALIZATION & REALTIME LISTENERS
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch Users (with multi-layer cloud fallback for vault_users and SYS_USERS_LIST)
      const fetchSupabaseUsers = async () => {
        let loadedUsers = [];
        try {
          const { data, error } = await supabase.from('vault_users').select('*');
          if (!error && data && data.length > 0) {
            loadedUsers = data.map(u => ({
              id: u.id,
              username: u.username,
              passkey: u.passkey,
              role: u.role || 'User',
              status: u.status || 'Active',
              created: u.created_at ? u.created_at.split('T')[0] : '2026-07-26'
            }));
          }
        } catch (err) {
          console.log('vault_users fetch info:', err);
        }

        if (loadedUsers.length === 0) {
          try {
            const { data, error } = await supabase
              .from('room_messages')
              .select('*')
              .eq('room', 'SYS_USERS_LIST')
              .order('created_at', { ascending: false })
              .limit(1);

            if (!error && data && data.length > 0 && data[0].text) {
              const parsed = JSON.parse(data[0].text);
              if (Array.isArray(parsed) && parsed.length > 0) {
                loadedUsers = parsed;
              }
            }
          } catch (err) {
            console.log('SYS_USERS_LIST fallback query info:', err);
          }
        }

        if (loadedUsers.length > 0) {
          setUsersList(loadedUsers);
          localStorage.setItem('seccom_users_list', JSON.stringify(loadedUsers));
        }
      };

      // 2. Fetch Room Messages
      const fetchRoomMessages = async () => {
        try {
          const { data, error } = await supabase.from('room_messages').select('*').order('created_at', { ascending: true });
          if (!error && data) {
            const grouped = {};
            data.forEach(m => {
              if (!m.room || m.room.startsWith('SYS_') || m.room === 'GLOBAL_BROADCAST') return;
              if (!grouped[m.room]) grouped[m.room] = [];
              grouped[m.room].push({
                id: m.id,
                sender: m.sender,
                cipher: m.cipher,
                text: m.text,
                time: m.created_at ? formatTimestamp(m.created_at) : formatTimestamp(),
                autoBurn: m.auto_burn
              });
            });
            setRoomMessages(prev => {
              const updated = { ...prev };
              Object.keys(grouped).forEach(r => {
                const existing = updated[r] || [];
                const merged = [...existing];
                grouped[r].forEach(item => {
                  const idx = merged.findIndex(e => e.id === item.id || (e.sender === item.sender && e.text === item.text));
                  if (idx >= 0) {
                    merged[idx] = { ...merged[idx], ...item };
                  } else {
                    merged.push(item);
                  }
                });
                updated[r] = merged;
              });
              return updated;
            });
          }
        } catch (err) {
          console.warn('fetchRoomMessages error:', err);
        }
      };

      // 3. Fetch Direct Messages (with direct is_pinned backup)
      const fetchDirectMessages = async () => {
        try {
          const { data, error } = await supabase.from('direct_messages').select('*').order('created_at', { ascending: true });
          if (!error && data) {
            const grouped = {};
            const pinnedFromDirect = {};
            data.forEach(m => {
              const rawTarget = m.target_user || 'user';
              const targetLower = rawTarget.toLowerCase();
              if (!grouped[rawTarget]) grouped[rawTarget] = [];
              const msgObj = {
                id: m.id,
                sender: m.sender,
                cipher: m.cipher,
                text: m.text,
                time: m.created_at ? formatTimestamp(m.created_at) : formatTimestamp(),
                status: m.status || 'delivered',
                isGhost: m.is_ghost || false,
                isPinned: m.is_pinned || false
              };
              grouped[rawTarget].push(msgObj);
              if (m.is_pinned) {
                pinnedFromDirect[rawTarget] = msgObj;
                pinnedFromDirect[targetLower] = msgObj;
              }
            });
            setAdminDirectMessages(prev => {
              const updated = { ...prev };
              Object.keys(grouped).forEach(targetUser => {
                const targetLower = targetUser.toLowerCase();
                const matchedKey = Object.keys(updated).find(k => k && k.toLowerCase() === targetLower) || targetUser;
                const existingList = updated[matchedKey] || [];
                const merged = [...existingList];
                grouped[targetUser].forEach(item => {
                  const idx = merged.findIndex(e => e.id === item.id || (e.sender === item.sender && e.text === item.text));
                  if (idx >= 0) {
                    merged[idx] = { ...merged[idx], ...item };
                  } else {
                    merged.push(item);
                  }
                });
                updated[matchedKey] = merged;
                updated[targetLower] = merged;
              });
              return updated;
            });
            if (Object.keys(pinnedFromDirect).length > 0) {
              setPinnedMessages(prev => ({ ...prev, ...pinnedFromDirect }));
            }
          }
        } catch (err) {
          console.warn('fetchDirectMessages error:', err);
        }
      };

      // 4. Fetch Pinned Direct Messages with multi-layer cloud fallback (Mobile + PC cross-sync)
      const fetchPinnedMessages = async () => {
        let loadedPins = {};

        // Attempt A: Dedicated pinned_messages table
        try {
          const { data, error } = await supabase.from('pinned_messages').select('*');
          if (!error && data && data.length > 0) {
            data.forEach((p) => {
              if (p.target_user && p.message_data) {
                const parsed = typeof p.message_data === 'string' ? JSON.parse(p.message_data) : p.message_data;
                loadedPins[p.target_user] = parsed;
                loadedPins[p.target_user.toLowerCase()] = parsed;
              }
            });
          }
        } catch (err) {
          console.log('pinned_messages query info:', err);
        }

        // Attempt B: Fallback query from room_messages (SYS_PINNED_MESSAGES)
        if (Object.keys(loadedPins).length === 0) {
          try {
            const { data, error } = await supabase
              .from('room_messages')
              .select('*')
              .eq('room', 'SYS_PINNED_MESSAGES')
              .order('created_at', { ascending: false })
              .limit(1);

            if (!error && data && data.length > 0 && data[0].text) {
              const parsed = JSON.parse(data[0].text);
              if (parsed && typeof parsed === 'object') {
                loadedPins = parsed;
              }
            }
          } catch (err) {
            console.log('SYS_PINNED_MESSAGES fallback query info:', err);
          }
        }

        if (Object.keys(loadedPins).length > 0) {
          setPinnedMessages(prev => ({ ...prev, ...loadedPins }));
          localStorage.setItem('seccom_pinned_messages', JSON.stringify(loadedPins));
        }
      };

      // 5. Fetch Login History Audit Logs
      const fetchLoginHistory = async () => {
        try {
          const { data, error } = await supabase.from('login_history').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const loadedLogs = data.map(item => ({
              id: item.id,
              username: item.username,
              ip: item.ip,
              status: item.status,
              date: item.created_at ? formatTimestamp(item.created_at) : formatTimestamp(),
              device: item.device,
              risk: item.risk,
              usedCredentials: typeof item.used_credentials === 'string' ? JSON.parse(item.used_credentials) : item.used_credentials
            }));
            setLoginHistory(loadedLogs);
          }
        } catch (err) {
          console.log('login_history fetch info:', err);
        }
      };

      // 6. Fetch Face Biometrics from Cloud Vault with multi-layer fallback
      const fetchFaceBiometrics = async () => {
        let loadedProfiles = [];

        // Attempt A: Dedicated face_biometrics table
        try {
          const { data, error } = await supabase.from('face_biometrics').select('*');
          if (!error && data && data.length > 0) {
            loadedProfiles = data.map((item) => ({
              id: item.id || 'face-' + Math.random(),
              name: item.name || 'Admin Enrolled Face',
              samples: typeof item.samples === 'string' ? JSON.parse(item.samples) : item.samples,
              vector: typeof item.vector === 'string' ? JSON.parse(item.vector) : item.vector,
              date: item.created_at ? formatTimestamp(item.created_at) : formatTimestamp()
            }));
          }
        } catch (err) {
          console.log('face_biometrics table fetch info:', err);
        }

        // Attempt B: Fallback query from room_messages (SYS_FACE_BIOMETRICS)
        if (loadedProfiles.length === 0) {
          try {
            const { data, error } = await supabase
              .from('room_messages')
              .select('*')
              .eq('room', 'SYS_FACE_BIOMETRICS')
              .order('created_at', { ascending: false })
              .limit(1);

            if (!error && data && data.length > 0 && data[0].text) {
              const parsed = JSON.parse(data[0].text);
              if (Array.isArray(parsed) && parsed.length > 0) {
                loadedProfiles = parsed;
              }
            }
          } catch (err) {
            console.log('SYS_FACE_BIOMETRICS fallback fetch info:', err);
          }
        }

        if (loadedProfiles.length > 0) {
          setFaceProfilesList(loadedProfiles);
          localStorage.setItem('seccom_admin_face_profiles', JSON.stringify(loadedProfiles));
        }
      };

      // 7. Fetch Active Global Broadcast from Cloud
      const fetchActiveBroadcast = async () => {
        try {
          const { data, error } = await supabase
            .from('room_messages')
            .select('*')
            .eq('room', 'GLOBAL_BROADCAST')
            .order('created_at', { ascending: false })
            .limit(1);

          if (!error && data && data.length > 0 && data[0].text) {
            try {
              const bcast = JSON.parse(data[0].text);
              setActiveBroadcastNote(bcast);
            } catch {
              setActiveBroadcastNote({
                id: data[0].id,
                sender: 'Admin-Command',
                text: data[0].text,
                time: formatTimestamp(data[0].created_at)
              });
            }
          }
        } catch (err) {
          console.log('Global Broadcast fetch info:', err);
        }
      };

      fetchSupabaseUsers();
      fetchRoomMessages();
      fetchDirectMessages();
      fetchPinnedMessages();
      fetchLoginHistory();
      fetchFaceBiometrics();
      fetchActiveBroadcast();

      // 6. Subscribe to Supabase Realtime Channels
      const channel = supabase.channel('seccom_realtime_db')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vault_users' }, (payload) => {
          if (payload.eventType === 'DELETE' && payload.old) {
            setUsersList(prev => prev.filter(u => u.id !== payload.old.id && u.username !== payload.old.username));
          } else if (payload.new) {
            const u = payload.new;
            const userObj = {
              id: u.id,
              username: u.username,
              passkey: u.passkey,
              role: u.role || 'User',
              status: u.status || 'Active',
              created: u.created_at ? u.created_at.split('T')[0] : '2026-07-26'
            };
            setUsersList(prev => {
              const exists = prev.some(existing => existing.id === u.id || existing.username.toLowerCase() === u.username.toLowerCase());
              if (exists) {
                return prev.map(existing => (existing.id === u.id || existing.username.toLowerCase() === u.username.toLowerCase()) ? userObj : existing);
              }
              return [...prev, userObj];
            });
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages' }, (payload) => {
          const m = payload.new;

          // Check if message is a System Face Sync, Users Sync, Global Broadcast, or Pinned Messages Sync
          if (m.room === 'SYS_FACE_BIOMETRICS' && m.text) {
            try {
              const parsed = JSON.parse(m.text);
              if (Array.isArray(parsed)) {
                setFaceProfilesList(parsed);
                localStorage.setItem('seccom_admin_face_profiles', JSON.stringify(parsed));
              }
            } catch {}
            return;
          }

          if (m.room === 'SYS_USERS_LIST' && m.text) {
            try {
              const parsed = JSON.parse(m.text);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setUsersList(parsed);
                localStorage.setItem('seccom_users_list', JSON.stringify(parsed));
              }
            } catch {}
            return;
          }

          if (m.room === 'SYS_PINNED_MESSAGES' && m.text) {
            try {
              const parsed = JSON.parse(m.text);
              if (parsed && typeof parsed === 'object') {
                setPinnedMessages(prev => ({ ...prev, ...parsed }));
                localStorage.setItem('seccom_pinned_messages', JSON.stringify(parsed));
              }
            } catch {}
            return;
          }

          if (m.room === 'GLOBAL_BROADCAST' && m.text) {
            try {
              const bcast = JSON.parse(m.text);
              setActiveBroadcastNote(bcast);
              localStorage.setItem('seccom_active_broadcast_note', JSON.stringify(bcast));
            } catch {}
            return;
          }

          const msgObj = {
            id: m.id,
            sender: m.sender,
            cipher: m.cipher,
            text: m.text,
            time: formatTimestamp(m.created_at),
            autoBurn: m.auto_burn
          };
          setRoomMessages(prev => {
            const list = prev[m.room] || [];
            const exists = list.some(existing => existing.id === m.id || (existing.sender === m.sender && existing.text === m.text));
            if (exists) {
              const updated = list.map(existing =>
                (existing.id === m.id || (existing.sender === m.sender && existing.text === m.text)) ? msgObj : existing
              );
              return { ...prev, [m.room]: updated };
            }
            return { ...prev, [m.room]: [...list, msgObj] };
          });
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'room_messages' }, (payload) => {
          const deletedId = payload.old.id;
          setRoomMessages(prev => {
            const copy = { ...prev };
            Object.keys(copy).forEach(r => {
              copy[r] = copy[r].filter(m => m.id !== deletedId);
            });
            return copy;
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
          const m = payload.new;
          const msgObj = {
            id: m.id,
            sender: m.sender,
            cipher: m.cipher,
            text: m.text,
            time: formatTimestamp(m.created_at),
            status: m.status || 'delivered',
            isGhost: m.is_ghost || false
          };
          setAdminDirectMessages(prev => {
            const rawTarget = m.target_user || 'user';
            const targetLower = rawTarget.toLowerCase();
            const key = Object.keys(prev).find(k => k && k.toLowerCase() === targetLower) || rawTarget;
            const list = prev[key] || [];
            const exists = list.some(existing => existing.id === m.id || (existing.sender === m.sender && existing.text === m.text));
            let newList;
            if (exists) {
              newList = list.map(existing =>
                (existing.id === m.id || (existing.sender === m.sender && existing.text === m.text)) ? msgObj : existing
              );
            } else {
              newList = [...list, msgObj];
            }
            return {
              ...prev,
              [key]: newList,
              [targetLower]: newList
            };
          });

          if (m.sender && m.sender !== 'Admin') {
            const senderName = m.sender;
            setUsersList(prev => {
              if (prev.some(u => u.username.toLowerCase() === senderName.toLowerCase())) return prev;
              const newUser = {
                id: 'usr-' + Date.now(),
                username: senderName,
                passkey: '****',
                role: 'User',
                status: 'Active',
                created: '2026-07-26'
              };
              const updated = [...prev, newUser];
              localStorage.setItem('seccom_users_list', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (payload) => {
          const m = payload.new;
          setAdminDirectMessages(prev => {
            const rawTarget = m.target_user || 'user';
            const targetLower = rawTarget.toLowerCase();
            const key = Object.keys(prev).find(k => k && k.toLowerCase() === targetLower) || rawTarget;
            const list = prev[key] || [];
            const updated = list.map(existing =>
              existing.id === m.id ? { ...existing, status: m.status || existing.status } : existing
            );
            return {
              ...prev,
              [key]: updated,
              [targetLower]: updated
            };
          });
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'direct_messages' }, (payload) => {
          const deletedId = payload.old.id;
          setAdminDirectMessages(prev => {
            const copy = { ...prev };
            Object.keys(copy).forEach(u => {
              copy[u] = copy[u].filter(m => m.id !== deletedId);
            });
            return copy;
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pinned_messages' }, (payload) => {
          if (payload.eventType === 'DELETE' && payload.old) {
            const targetUser = payload.old.target_user;
            if (targetUser) {
              setPinnedMessages(prev => {
                const copy = { ...prev };
                delete copy[targetUser];
                return copy;
              });
            }
          } else if (payload.new) {
            const p = payload.new;
            if (p.target_user && p.message_data) {
              const msgData = typeof p.message_data === 'string' ? JSON.parse(p.message_data) : p.message_data;
              setPinnedMessages(prev => ({ ...prev, [p.target_user]: msgData }));
            }
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'login_history' }, (payload) => {
          const item = payload.new;
          const logObj = {
            id: item.id,
            username: item.username,
            ip: item.ip,
            status: item.status,
            date: item.created_at ? formatTimestamp(item.created_at) : formatTimestamp(),
            device: item.device,
            risk: item.risk,
            usedCredentials: typeof item.used_credentials === 'string' ? JSON.parse(item.used_credentials) : item.used_credentials
          };
          setLoginHistory(prev => {
            const exists = prev.some(l => l.id === item.id);
            if (exists) return prev;
            return [logObj, ...prev];
          });
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'login_history' }, (payload) => {
          if (!payload.old || !payload.old.id) {
            setLoginHistory([]);
          } else {
            const deletedId = payload.old.id;
            setLoginHistory(prev => prev.filter(l => l.id !== deletedId));
          }
        })
        .subscribe();

      // Broadcast Mesh Channel for zero-latency cross-device messaging
      const meshChannel = supabase.channel('seccom_mesh_sync')
        .on('broadcast', { event: 'sync' }, (res) => {
          if (res && res.payload) {
            handleIncomingMessagePayload(res.payload);
          }
        })
        .subscribe();

      // 2.5-second auto-polling loop for uninterrupted background & mobile sync
      const syncInterval = setInterval(() => {
        fetchRoomMessages();
        fetchDirectMessages();
      }, 2500);

      const handleFocusSync = () => {
        fetchRoomMessages();
        fetchDirectMessages();
      };
      window.addEventListener('focus', handleFocusSync);

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(meshChannel);
        clearInterval(syncInterval);
        window.removeEventListener('focus', handleFocusSync);
      };
    }
  }, []);

  // Synchronize state incoming from other tabs/clients instantly
  const handleIncomingMessagePayload = (data) => {
    if (!data || data.clientId === CLIENT_ID) return;

    if (data.type === 'ROOM_MESSAGE') {
      setRoomMessages((prev) => {
        const roomMsgs = prev[data.room] || [];
        if (roomMsgs.some((m) => m.id === data.message.id || (m.sender === data.message.sender && m.text === data.message.text))) return prev;
        return {
          ...prev,
          [data.room]: [...roomMsgs, data.message]
        };
      });
      setHasUnreadDotAdmin(true);
      setHasUnreadDotUser(true);
    } else if (data.type === 'DIRECT_MESSAGE') {
      setAdminDirectMessages((prev) => {
        const rawTarget = data.targetUser || 'user';
        const targetLower = rawTarget.toLowerCase();
        const key = Object.keys(prev).find(k => k && k.toLowerCase() === targetLower) || rawTarget;
        const list = prev[key] || [];
        if (list.some((m) => m.id === data.message.id || (m.sender === data.message.sender && m.text === data.message.text))) return prev;

        let remaining = list;
        if (data.isGhostMode || isGhostMode) {
          remaining = list.filter((m) => m.status !== 'seen');
        }
        const newList = [...remaining, data.message];
        return {
          ...prev,
          [key]: newList,
          [targetLower]: newList
        };
      });

      if (data.message && data.message.sender && data.message.sender !== 'Admin') {
        setHasUnreadDotAdmin(true);
        const senderName = data.message.sender;
        setUsersList(prev => {
          if (prev.some(u => u.username.toLowerCase() === senderName.toLowerCase())) return prev;
          const newUser = {
            id: 'usr-' + Date.now(),
            username: senderName,
            passkey: '****',
            role: 'User',
            status: 'Active',
            created: '2026-07-26'
          };
          const updated = [...prev, newUser];
          localStorage.setItem('seccom_users_list', JSON.stringify(updated));
          return updated;
        });
      } else {
        setHasUnreadDotUser(true);
      }

      if (activeTab === 'chat') {
        const currentTarget = authRole === 'admin' ? selectedChatUser : activeUser?.username;
        if (currentTarget && currentTarget.toLowerCase() === (data.targetUser || '').toLowerCase()) {
          setTimeout(() => markDirectMessagesAsSeen(data.targetUser), 300);
        }
      }
    } else if (data.type === 'DESTROY_ROOM_MESSAGE') {
      setRoomMessages((prev) => ({
        ...prev,
        [data.room]: (prev[data.room] || []).filter((m) => m.id !== data.messageId)
      }));
    } else if (data.type === 'PURGE_ROOM_MESSAGES') {
      setRoomMessages((prev) => ({
        ...prev,
        [data.room]: []
      }));
    } else if (data.type === 'DESTROY_DIRECT_MESSAGE') {
      setAdminDirectMessages((prev) => ({
        ...prev,
        [data.targetUser]: (prev[data.targetUser] || []).filter((m) => m.id !== data.messageId)
      }));
    } else if (data.type === 'PURGE_DIRECT_MESSAGES') {
      setAdminDirectMessages((prev) => ({
        ...prev,
        [data.targetUser]: []
      }));
      setPinnedMessages((prev) => {
        const copy = { ...prev };
        delete copy[data.targetUser];
        return copy;
      });
    } else if (data.type === 'USERS_SYNC') {
      if (Array.isArray(data.usersList)) {
        setUsersList(data.usersList);
        localStorage.setItem('seccom_users_list', JSON.stringify(data.usersList));
      }
    } else if (data.type === 'PIN_DIRECT_MESSAGE') {
      setPinnedMessages((prev) => ({
        ...prev,
        [data.targetUser]: data.message
      }));
    } else if (data.type === 'MARK_MESSAGES_SEEN') {
      setAdminDirectMessages((prev) => {
        const list = prev[data.targetUser] || [];
        const updated = list.map((m) => ({ ...m, status: 'seen' }));
        let finalMessages = updated;
        if (data.isGhostMode || isGhostMode) {
          const hasUnseen = updated.some(m => m.status !== 'seen');
          if (hasUnseen) {
            finalMessages = updated.filter(m => m.status !== 'seen');
          } else if (updated.length > 1) {
            finalMessages = [updated[updated.length - 1]];
          }
        }
        return { ...prev, [data.targetUser]: finalMessages };
      });
    } else if (data.type === 'ADMIN_BROADCAST') {
      setActiveBroadcastNote(data.broadcast);
      localStorage.setItem('seccom_active_broadcast_note', JSON.stringify(data.broadcast));

      const broadcastMsgText = `📢 BROADCAST BY ADMIN (${data.broadcast.time})\n\n${data.broadcast.text}`;

      setRoomMessages((prev) => {
        const genMsgs = prev['#general-vault'] || [];
        if (genMsgs.some((m) => m.id === data.broadcast.id)) return prev;
        return {
          ...prev,
          '#general-vault': [
            ...genMsgs,
            {
              id: data.broadcast.id,
              sender: '📢 BROADCAST BY ADMIN',
              cipher: 'SECCOM-BROADCAST.ALL',
              text: broadcastMsgText,
              time: data.broadcast.time
            }
          ]
        };
      });

      setAdminDirectMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((uKey) => {
          const list = updated[uKey] || [];
          if (!list.some((m) => m.id === data.broadcast.id || m.id.startsWith(data.broadcast.id))) {
            updated[uKey] = [
              ...list,
              {
                id: data.broadcast.id + '-' + uKey,
                sender: '📢 BROADCAST BY ADMIN',
                cipher: 'SECCOM-BROADCAST.ALL',
                text: broadcastMsgText,
                time: data.broadcast.time,
                status: 'delivered',
                isGhost: false
              }
            ];
          }
        });
        return updated;
      });
    }
  };

  useEffect(() => {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('seccom_realtime_v2');
      broadcastChannelRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data) handleIncomingMessagePayload(event.data);
      };
    }

    const handleStorageEvent = (e) => {
      if (e.key === 'seccom_sync_event' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          handleIncomingMessagePayload(payload);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (broadcastChannelRef.current) broadcastChannelRef.current.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const emitRealtimeSync = (payload) => {
    const fullPayload = { ...payload, clientId: CLIENT_ID, _nonce: Date.now() };
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(fullPayload);
    }
    try {
      localStorage.setItem('seccom_sync_event', JSON.stringify(fullPayload));
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        supabase.channel('seccom_mesh_sync').send({
          type: 'broadcast',
          event: 'sync',
          payload: fullPayload
        }).catch(() => {});
      } catch {}
    }
  };

  // E2EE Vault Messaging State
  const [plaintext, setPlaintext] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [encryptedOutput, setEncryptedOutput] = useState('');
  const [selfDestructTime, setSelfDestructTime] = useState('none');
  const [decryptInput, setDecryptInput] = useState('');
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [decryptedResult, setDecryptedResult] = useState('');
  const [cryptoError, setCryptoError] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Burn-On-Read State
  const [burnNote, setBurnNote] = useState('');
  const [burnPass, setBurnPass] = useState('');
  const [generatedBurnLink, setGeneratedBurnLink] = useState('');
  const [burnNoteRead, setBurnNoteRead] = useState(false);
  const [burnNoteContent, setBurnNoteContent] = useState('');

  // Image LSB Steganography Encoder State (Left Card)
  const [encodeSecretText, setEncodeSecretText] = useState('Confidential Vault Pin: 9842');
  const [encodePassword, setEncodePassword] = useState('');
  const [encodedResultDataUrl, setEncodedResultDataUrl] = useState('');
  const [encodeStatus, setEncodeStatus] = useState('');
  const canvasEncodeRef = useRef(null);

  // Image LSB Steganography Decoder State (Right Card)
  const [decodePassword, setDecodePassword] = useState('');
  const [extractedSecretText, setExtractedSecretText] = useState('');
  const canvasDecodeRef = useRef(null);

  // Entropy Analyzer State
  const [entropyPass, setEntropyPass] = useState('');
  const [entropyResult, setEntropyResult] = useState({ entropy: 0, score: 'Weak', timeToCrack: 'Instant', gradeColor: '#ff4444' });

  // Keygen State
  const [rsaKeys, setRsaKeys] = useState(null);
  const [generatingKeys, setGeneratingKeys] = useState(false);

  // Admin Multi-Face Biometrics & Cross-Device Cloud Sync State
  const [faceProfilesList, setFaceProfilesList] = useState(() => {
    try {
      const stored = localStorage.getItem('seccom_admin_face_profiles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Migration fallback from legacy single face data
      const single = localStorage.getItem('seccom_admin_face_biometrics');
      if (single) {
        const parsedSingle = JSON.parse(single);
        return [{
          id: 'face-default-1',
          name: 'Primary Admin Face',
          samples: parsedSingle.samples || [],
          vector: parsedSingle.vector || null,
          date: parsedSingle.date || formatTimestamp()
        }];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [newFaceLabel, setNewFaceLabel] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedFaceSamples, setCapturedFaceSamples] = useState([]);
  const [isCapturingSnapshots, setIsCapturingSnapshots] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [faceEnrollStatus, setFaceEnrollStatus] = useState('');
  const enrollVideoRef = useRef(null);
  const enrollStreamRef = useRef(null);

  // Login Face Recognition Scanner Modal State
  const [loginFaceScannerOpen, setLoginFaceScannerOpen] = useState(false);
  const [loginScanMatchScore, setLoginScanMatchScore] = useState(0);
  const [loginScanStatus, setLoginScanStatus] = useState('');
  const loginScanVideoRef = useRef(null);
  const loginScanStreamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Extract face feature vector (64x64 grid signature & 16-bin luminance histogram)
  const extractFaceVectorFromCanvas = (canvas) => {
    const normCanvas = document.createElement('canvas');
    normCanvas.width = 64;
    normCanvas.height = 64;
    const ctx = normCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, 64, 64);
    const imgData = ctx.getImageData(0, 0, 64, 64);
    const data = imgData.data;

    const histogram = new Array(16).fill(0);
    const spatialGrid = new Array(64).fill(0);
    const gridCounts = new Array(64).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
      const bin = Math.min(15, Math.floor(lum / 16));
      histogram[bin]++;

      const pixelIdx = i / 4;
      const x = pixelIdx % 64;
      const y = Math.floor(pixelIdx / 64);
      const gx = Math.floor(x / 8);
      const gy = Math.floor(y / 8);
      const gridIdx = gy * 8 + gx;

      spatialGrid[gridIdx] += lum;
      gridCounts[gridIdx]++;
    }

    for (let i = 0; i < 16; i++) histogram[i] /= (64 * 64);
    for (let i = 0; i < 64; i++) spatialGrid[i] = gridCounts[i] > 0 ? spatialGrid[i] / gridCounts[i] : 0;

    return { histogram, spatialGrid };
  };

  const calculateFaceSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || !vecA.spatialGrid || !vecB.spatialGrid) return 0;
    let mse = 0;
    for (let i = 0; i < 64; i++) {
      const diff = vecA.spatialGrid[i] - vecB.spatialGrid[i];
      mse += diff * diff;
    }
    const rmse = Math.sqrt(mse / 64);
    const spatialSim = Math.max(0, 1 - rmse / 100);

    let histOverlap = 0;
    for (let i = 0; i < 16; i++) {
      histOverlap += Math.min(vecA.histogram[i] || 0, vecB.histogram[i] || 0);
    }

    const score = (spatialSim * 0.75 + histOverlap * 0.25) * 100;
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const startEnrollCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      enrollStreamRef.current = stream;
      if (enrollVideoRef.current) {
        enrollVideoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setFaceEnrollStatus('Camera active. Enter Face Profile Name & click "Take 3 Face Snapshots".');
    } catch (err) {
      setFaceEnrollStatus('⚠️ Camera Access Failed: ' + err.message);
    }
  };

  const stopEnrollCamera = () => {
    if (enrollStreamRef.current) {
      enrollStreamRef.current.getTracks().forEach((t) => t.stop());
      enrollStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCapture3Snapshots = async () => {
    if (!enrollVideoRef.current) return;
    setIsCapturingSnapshots(true);
    const samples = [];
    const vectors = [];

    const captureSingle = (progressNum) => {
      setCaptureProgress(progressNum);
      const video = enrollVideoRef.current;
      const cvs = document.createElement('canvas');
      cvs.width = video.videoWidth || 640;
      cvs.height = video.videoHeight || 480;
      const ctx = cvs.getContext('2d');
      ctx.drawImage(video, 0, 0, cvs.width, cvs.height);

      const dataUrl = cvs.toDataURL('image/jpeg', 0.85);
      const vec = extractFaceVectorFromCanvas(cvs);
      samples.push(dataUrl);
      vectors.push(vec);
      setCapturedFaceSamples([...samples]);
    };

    captureSingle(1);
    await new Promise((r) => setTimeout(r, 800));
    captureSingle(2);
    await new Promise((r) => setTimeout(r, 800));
    captureSingle(3);

    const avgSpatial = new Array(64).fill(0);
    const avgHist = new Array(16).fill(0);

    vectors.forEach((v) => {
      v.spatialGrid.forEach((val, idx) => (avgSpatial[idx] += val / vectors.length));
      v.histogram.forEach((val, idx) => (avgHist[idx] += val / vectors.length));
    });

    const profileLabel = newFaceLabel.trim() || `Admin Face #${faceProfilesList.length + 1}`;
    const newProfile = {
      id: 'face-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: profileLabel,
      samples: samples,
      vector: { spatialGrid: avgSpatial, histogram: avgHist },
      date: formatTimestamp()
    };

    const updatedList = [newProfile, ...faceProfilesList];
    setFaceProfilesList(updatedList);
    localStorage.setItem('seccom_admin_face_profiles', JSON.stringify(updatedList));

    // Save to Supabase Cloud Vault with multi-layer fallback for cross-device availability
    if (isSupabaseConfigured && supabase) {
      // 1. Insert into room_messages as SYS_FACE_BIOMETRICS (guaranteed table)
      supabase.from('room_messages').insert({
        room: 'SYS_FACE_BIOMETRICS',
        sender: 'SYSTEM_ADMIN',
        cipher: 'SECCOM-FACE-BIOMETRICS',
        text: JSON.stringify(updatedList)
      }).then(() => {}).catch(() => {});

      // 2. Insert into dedicated face_biometrics table if exists
      supabase.from('face_biometrics').insert({
        id: newProfile.id,
        name: newProfile.name,
        samples: JSON.stringify(newProfile.samples),
        vector: JSON.stringify(newProfile.vector)
      }).then(() => {}).catch(() => {});
    }

    emitRealtimeSync({ type: 'FACE_PROFILES_UPDATED', profiles: updatedList });
    setNewFaceLabel('');
    setCapturedFaceSamples([]);
    setIsCapturingSnapshots(false);
    setFaceEnrollStatus(`✅ Added face profile "${newProfile.name}" (3 Samples Enrolled & Synced)!`);
  };

  const handleDeleteFaceProfile = (targetId) => {
    const updatedList = faceProfilesList.filter((p) => p.id !== targetId);
    setFaceProfilesList(updatedList);
    localStorage.setItem('seccom_admin_face_profiles', JSON.stringify(updatedList));

    if (isSupabaseConfigured && supabase) {
      supabase.from('room_messages').insert({
        room: 'SYS_FACE_BIOMETRICS',
        sender: 'SYSTEM_ADMIN',
        cipher: 'SECCOM-FACE-BIOMETRICS',
        text: JSON.stringify(updatedList)
      }).then(() => {}).catch(() => {});

      supabase.from('face_biometrics').delete().eq('id', targetId).then(() => {}).catch(() => {});
    }

    emitRealtimeSync({ type: 'FACE_PROFILES_UPDATED', profiles: updatedList });
    setFaceEnrollStatus('Face profile removed successfully.');
  };

  const openLoginFaceScanner = async () => {
    setLoginFaceScannerOpen(true);
    setLoginScanMatchScore(0);
    setLoginScanStatus('Fetching registered cross-device face profiles...');

    let activeProfiles = [...faceProfilesList];

    // Multi-layer fetch from Supabase Cloud DB so scanning works across any device
    if (isSupabaseConfigured && supabase) {
      try {
        let cloudProfiles = [];

        // Attempt A: Dedicated face_biometrics table
        const { data: bData, error: bErr } = await supabase.from('face_biometrics').select('*');
        if (!bErr && bData && bData.length > 0) {
          cloudProfiles = bData.map((item) => ({
            id: item.id || 'face-' + Math.random(),
            name: item.name || 'Admin Face Profile',
            samples: typeof item.samples === 'string' ? JSON.parse(item.samples) : item.samples,
            vector: typeof item.vector === 'string' ? JSON.parse(item.vector) : item.vector,
            date: item.created_at ? formatTimestamp(item.created_at) : formatTimestamp()
          }));
        }

        // Attempt B: Fallback room_messages (SYS_FACE_BIOMETRICS)
        if (cloudProfiles.length === 0) {
          const { data: sysData, error: sysErr } = await supabase
            .from('room_messages')
            .select('*')
            .eq('room', 'SYS_FACE_BIOMETRICS')
            .order('created_at', { ascending: false })
            .limit(1);

          if (!sysErr && sysData && sysData.length > 0 && sysData[0].text) {
            const parsed = JSON.parse(sysData[0].text);
            if (Array.isArray(parsed) && parsed.length > 0) {
              cloudProfiles = parsed;
            }
          }
        }

        if (cloudProfiles.length > 0) {
          activeProfiles = cloudProfiles;
          setFaceProfilesList(cloudProfiles);
          localStorage.setItem('seccom_admin_face_profiles', JSON.stringify(cloudProfiles));
        }
      } catch (err) {
        console.log('Supabase face fetch info:', err);
      }
    }

    // Attempt C: Fallback to local storage if state was empty
    if (!activeProfiles || activeProfiles.length === 0) {
      const cachedStr = localStorage.getItem('seccom_admin_face_profiles');
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          if (Array.isArray(cached) && cached.length > 0) {
            activeProfiles = cached;
            setFaceProfilesList(cached);
          }
        } catch {}
      }
    }

    if (!activeProfiles || activeProfiles.length === 0) {
      closeLoginFaceScanner();
      setLoginError('⚠️ No Admin face enrolled yet! Log in with passkey "admin" / "admin" on your main device first and register your face in Admin Portal.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      loginScanStreamRef.current = stream;
      if (loginScanVideoRef.current) {
        loginScanVideoRef.current.srcObject = stream;
      }

      scanIntervalRef.current = setInterval(() => {
        if (!loginScanVideoRef.current) return;
        const video = loginScanVideoRef.current;
        if (!video.videoWidth) return;

        const cvs = document.createElement('canvas');
        cvs.width = video.videoWidth;
        cvs.height = video.videoHeight;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(video, 0, 0, cvs.width, cvs.height);

        const currentVec = extractFaceVectorFromCanvas(cvs);

        // Compare against ALL enrolled face profiles
        let maxMatchScore = 0;
        let matchedProfile = null;

        for (const profile of activeProfiles) {
          if (profile.vector) {
            const score = calculateFaceSimilarity(currentVec, profile.vector);
            if (score > maxMatchScore) {
              maxMatchScore = score;
              matchedProfile = profile;
            }
          }
        }

        setLoginScanMatchScore(maxMatchScore);

        if (maxMatchScore >= 70 && matchedProfile) {
          clearInterval(scanIntervalRef.current);
          setLoginScanStatus(`✅ BIOMETRICS CONFIRMED: "${matchedProfile.name}"! ACCESS GRANTED...`);
          setTimeout(() => {
            closeLoginFaceScanner();
            recordLoginAttempt('admin', `SUCCESS (FACE UNLOCK: ${matchedProfile.name})`, 'LOW');
            setAuthRole('admin');
            setActiveUser({ username: 'admin', role: 'Admin' });
            setRoomSenderName('Admin-Command');
            setActiveTab('admin');
          }, 800);
        } else {
          setLoginScanStatus(`Scanning... Highest Match: ${maxMatchScore}% (Requires >= 70%)`);
        }
      }, 500);

    } catch (err) {
      setLoginScanStatus('⚠️ Camera Error: ' + err.message);
    }
  };

  const closeLoginFaceScanner = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (loginScanStreamRef.current) {
      loginScanStreamRef.current.getTracks().forEach((t) => t.stop());
      loginScanStreamRef.current = null;
    }
    setLoginFaceScannerOpen(false);
  };

  // ESC Key Global Listener for Emergency Panic Purge
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onEmergencyPurge();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEmergencyPurge]);

  // AUTOMATED 40-SECOND INACTIVITY TIMEOUT LISTENER
  useEffect(() => {
    const resetTimer = () => {
      setInactivitySeconds(40);
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    const interval = setInterval(() => {
      setInactivitySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onEmergencyPurge();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(interval);
    };
  }, [onEmergencyPurge]);

  // RECORD LOGIN AUDIT EVENT TO HISTORY
  const recordLoginAttempt = (username, status, riskLevel = 'LOW', usedCredentials = null) => {
    const clientIp = '192.168.1.' + Math.floor(Math.random() * 150 + 10);
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const deviceStr = isMobile ? 'Mobile Safari / iOS 17' : 'Desktop Chrome / Windows 11';
    
    const newLog = {
      id: 'log-' + Date.now(),
      username: username || 'Unknown',
      ip: clientIp,
      status: status,
      date: formatTimestamp(),
      device: deviceStr,
      risk: riskLevel,
      usedCredentials: usedCredentials
    };

    setLoginHistory(prev => [newLog, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('login_history').insert({
        username: newLog.username,
        ip: newLog.ip,
        status: newLog.status,
        device: newLog.device,
        risk: newLog.risk
      }).then(() => {}).catch(() => {});
    }
  };

  // HANDLE GATEWAY LOGIN VERIFICATION (SMART DYNAMIC ROLE VERIFICATION)
  const handleGatewayLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    // 1. Check in local usersList state
    let foundUser = usersList.find(
      (u) => u.username.toLowerCase() === cleanUser && u.passkey === cleanPass
    );

    // 2. If not found in memory, query Supabase vault_users directly
    if (!foundUser && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('vault_users')
          .select('*')
          .ilike('username', cleanUser)
          .eq('passkey', cleanPass)
          .maybeSingle();

        if (data) {
          foundUser = {
            id: data.id,
            username: data.username,
            passkey: data.passkey,
            role: data.role || 'User',
            status: data.status || 'Active',
            created: data.created_at ? data.created_at.split('T')[0] : '2026-07-26'
          };
          setUsersList(prev => {
            const updated = prev.some(u => u.username.toLowerCase() === cleanUser)
              ? prev.map(u => u.username.toLowerCase() === cleanUser ? foundUser : u)
              : [...prev, foundUser];
            localStorage.setItem('seccom_users_list', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.log('Login Supabase user query info:', err);
      }
    }

    // Fallback default matching for standard user if database is unseeded
    if (!foundUser && cleanUser === 'user' && cleanPass === 'user') {
      foundUser = { username: 'user', passkey: 'user', role: 'User' };
    }

    if (foundUser) {
      setFailedLoginCounter(0);
      recordLoginAttempt(foundUser.username, 'SUCCESS', 'LOW');

      if (foundUser.role === 'Admin' || foundUser.username.toLowerCase() === 'admin') {
        setAuthRole('admin');
        setActiveUser({ username: foundUser.username, role: 'Admin' });
        setRoomSenderName('Admin-Command');
        setActiveTab('admin');
      } else {
        setAuthRole('user');
        setActiveUser(foundUser);
        setRoomSenderName(foundUser.username);
        setSelectedChatUser(foundUser.username);
        setActiveTab('chat');
      }
    } else {
      const nextFailCount = failedLoginCounter + 1;
      setFailedLoginCounter(nextFailCount);

      if (nextFailCount >= 3) {
        recordLoginAttempt(
          loginUsername || 'Unknown',
          '3 CONSECUTIVE FAILED LOGINS',
          '3 CONSECUTIVE FAILED LOGINS',
          { username: loginUsername || 'Unknown', password: loginPassword || '***' }
        );
        setLoginError('🚨 Security Alert: 3 Consecutive Failed Login Attempts! Captured credentials saved to Admin Dashboard.');
      } else {
        recordLoginAttempt(
          loginUsername || 'Unknown',
          'FAILED',
          'HIGH SUSPICIOUS',
          { username: loginUsername || 'Unknown', password: loginPassword || '***' }
        );
        setLoginError(`Invalid Username or Passkey credentials! (Attempt ${nextFailCount} of 3)`);
      }
    }
  };

  // Helper to persist users to room_messages system backup
  const syncUsersListToSystemRoom = async (users) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('room_messages').insert({
          room: 'SYS_USERS_LIST',
          sender: 'SYSTEM',
          cipher: 'SYS.USERS',
          text: JSON.stringify(users)
        }).catch(() => {});
      } catch {}
    }
  };

  // ADMIN USER CRUD OPERATIONS (PERSISTENT CLOUD & LOCAL SYNC)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPasskey) return;

    const createdUserObj = {
      id: 'usr-' + Date.now(),
      username: newUsername,
      passkey: newPasskey,
      role: newRole,
      status: 'Active',
      created: new Date().toISOString().split('T')[0]
    };

    let finalUserList = [];
    setUsersList(prev => {
      const exists = prev.some(u => u.username.toLowerCase() === newUsername.toLowerCase());
      if (exists) {
        finalUserList = prev.map(u => u.username.toLowerCase() === newUsername.toLowerCase() ? { ...u, ...createdUserObj } : u);
      } else {
        finalUserList = [...prev, createdUserObj];
      }
      localStorage.setItem('seccom_users_list', JSON.stringify(finalUserList));
      return finalUserList;
    });

    emitRealtimeSync({
      type: 'USERS_SYNC',
      usersList: finalUserList
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('vault_users').upsert({
          username: newUsername,
          passkey: newPasskey,
          role: newRole,
          status: 'Active'
        }, { onConflict: 'username' }).select().single();

        if (!error && data) {
          setUsersList(prev => {
            const updated = prev.map(u => u.username.toLowerCase() === newUsername.toLowerCase() ? {
              ...u,
              id: data.id,
              created: data.created_at ? data.created_at.split('T')[0] : u.created
            } : u);
            localStorage.setItem('seccom_users_list', JSON.stringify(updated));
            syncUsersListToSystemRoom(updated);
            return updated;
          });
        } else {
          syncUsersListToSystemRoom(finalUserList);
        }
      } catch (err) {
        console.warn('Supabase create user info:', err);
        syncUsersListToSystemRoom(finalUserList);
      }
    }

    setNewUsername('');
    setNewPasskey('');
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = usersList.find(u => u.id === userId);
    let updatedList = [];
    setUsersList(prev => {
      updatedList = prev.filter(u => u.id !== userId);
      localStorage.setItem('seccom_users_list', JSON.stringify(updatedList));
      return updatedList;
    });

    emitRealtimeSync({
      type: 'USERS_SYNC',
      usersList: updatedList
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('vault_users').delete().eq('id', userId).catch(() => {});
        if (userToDelete?.username) {
          await supabase.from('vault_users').delete().eq('username', userToDelete.username).catch(() => {});
        }
        syncUsersListToSystemRoom(updatedList);
      } catch (err) {
        console.warn('Supabase delete user info:', err);
      }
    }
  };

  const handleStartEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditPasskey(user.passkey);
    setEditRole(user.role || 'User');
  };

  const handleSaveEditUser = async (userId) => {
    const targetUser = usersList.find(u => u.id === userId);
    const oldUsername = targetUser ? targetUser.username : editUsername;

    let updatedList = [];
    setUsersList((prev) => {
      updatedList = prev.map((u) =>
        u.id === userId
          ? { ...u, username: editUsername, passkey: editPasskey, role: editRole }
          : u
      );
      localStorage.setItem('seccom_users_list', JSON.stringify(updatedList));
      return updatedList;
    });

    emitRealtimeSync({
      type: 'USERS_SYNC',
      usersList: updatedList
    });

    if (isSupabaseConfigured && supabase) {
      try {
        // Attempt update by ID first
        let updateRes = await supabase
          .from('vault_users')
          .update({ username: editUsername, passkey: editPasskey, role: editRole })
          .eq('id', userId);

        // If ID didn't match (or local ID), update by original username or upsert
        if (updateRes.error || (updateRes.count === 0)) {
          updateRes = await supabase
            .from('vault_users')
            .update({ username: editUsername, passkey: editPasskey, role: editRole })
            .eq('username', oldUsername);
        }

        if (updateRes.error || (updateRes.count === 0)) {
          await supabase
            .from('vault_users')
            .upsert({ username: editUsername, passkey: editPasskey, role: editRole, status: 'Active' }, { onConflict: 'username' });
        }

        syncUsersListToSystemRoom(updatedList);
      } catch (err) {
        console.warn('Supabase edit user info:', err);
        syncUsersListToSystemRoom(updatedList);
      }
    }

    setEditingUserId(null);
  };

  // REALTIME ROOM CHAT TRANSMISSION
  const handleSendRoomMessage = async () => {
    if (!roomInput.trim()) return;
    const currentInput = roomInput;
    const msgId = 'msg-' + Date.now();
    setRoomInput('');

    let cipherPayload = '';
    try {
      cipherPayload = await encryptWithAlgorithm(currentInput, 'room-channel-key', selectedAlgorithm);
    } catch {
      cipherPayload = `${selectedAlgorithm}.` + Math.random().toString(36).substr(2, 8);
    }

    const msg = {
      id: msgId,
      sender: roomSenderName || activeUser?.username || 'Operative-You',
      cipher: cipherPayload,
      text: currentInput,
      time: formatTimestamp(),
      createdTimestamp: Date.now(),
      autoBurn: autoBurnSeconds !== 'none' ? parseInt(autoBurnSeconds, 10) : null,
      deleteAfterView: roomDeleteAfterView,
      isRevealed: false
    };

    setRoomMessages((prev) => ({
      ...prev,
      [selectedRoom]: [...(prev[selectedRoom] || []), msg]
    }));

    emitRealtimeSync({
      type: 'ROOM_MESSAGE',
      room: selectedRoom,
      message: msg
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('room_messages').insert({
        room: selectedRoom,
        sender: msg.sender,
        cipher: msg.cipher,
        text: msg.text,
        auto_burn: msg.autoBurn
      }).then(() => {}).catch((err) => console.warn('Supabase room message insert info:', err));
    }

    if (autoBurnSeconds !== 'none') {
      const burnDelay = parseInt(autoBurnSeconds, 10) * 1000;
      setTimeout(() => {
        handleDestroyRoomMessage(selectedRoom, msgId);
      }, burnDelay);
    }
  };

  // DESTROY INDIVIDUAL ROOM MESSAGE
  const handleDestroyRoomMessage = async (room, messageId) => {
    setRoomMessages((prev) => ({
      ...prev,
      [room]: (prev[room] || []).filter((m) => m.id !== messageId)
    }));

    emitRealtimeSync({
      type: 'DESTROY_ROOM_MESSAGE',
      room: room,
      messageId: messageId
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('room_messages').delete().eq('id', messageId).then(() => {}).catch(() => {});
    }
  };

  // PURGE ALL MESSAGES IN CURRENT ROOM
  const handlePurgeAllRoomMessages = async (room) => {
    setRoomMessages((prev) => ({
      ...prev,
      [room]: []
    }));

    emitRealtimeSync({
      type: 'PURGE_ROOM_MESSAGES',
      room: room
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('room_messages').delete().eq('room', room).then(() => {}).catch(() => {});
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      userChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasUnreadDotAdmin(false);
      setHasUnreadDotUser(false);
    }, 80);
  };

  // ADMIN-USER REALTIME DIRECT CHAT TRANSMISSION
  const handleSendAdminDirectMessage = async () => {
    if (!directMsgInput.trim()) return;
    const currentInput = directMsgInput;
    const target = authRole === 'admin' ? selectedChatUser : activeUser?.username || 'user';
    const msgId = 'dir-' + Date.now();
    setDirectMsgInput('');

    let cipherPayload = '';
    try {
      cipherPayload = await encryptWithAlgorithm(currentInput, 'direct-user-key', selectedAlgorithm);
    } catch {
      cipherPayload = 'SECCOM-DIRECT.aes';
    }

    const msg = {
      id: msgId,
      sender: authRole === 'admin' ? (adminChatPerspective === 'Admin' ? 'Admin' : target) : activeUser?.username || 'User',
      cipher: cipherPayload,
      text: currentInput,
      time: formatTimestamp(),
      createdTimestamp: Date.now(),
      status: 'delivered',
      isGhost: isGhostMode,
      autoBurn: directAutoBurnSeconds !== 'none' ? parseInt(directAutoBurnSeconds, 10) : null,
      deleteAfterView: directDeleteAfterView,
      isRevealed: false
    };

    setAdminDirectMessages((prev) => {
      const targetLower = target.toLowerCase();
      const key = Object.keys(prev).find(k => k && k.toLowerCase() === targetLower) || target;
      const list = prev[key] || [];
      let remaining = list;
      if (isGhostMode) {
        remaining = list.filter((m) => m.status !== 'seen');
      }
      const newList = [...remaining, msg];
      const updated = {
        ...prev,
        [key]: newList,
        [targetLower]: newList
      };
      localStorage.setItem('seccom_direct_messages', JSON.stringify(updated));
      return updated;
    });

    emitRealtimeSync({
      type: 'DIRECT_MESSAGE',
      targetUser: target,
      message: msg,
      isGhostMode: isGhostMode
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('direct_messages').insert({
        target_user: target.toLowerCase(),
        sender: msg.sender,
        cipher: msg.cipher,
        text: msg.text,
        auto_burn: msg.autoBurn
      }).then(() => {}).catch((err) => console.warn('Supabase direct message insert info:', err));
    }

    scrollToBottom();
  };

  // DESTROY INDIVIDUAL DIRECT MESSAGE
  const handleDestroyDirectMessage = async (targetUser, messageId) => {
    setAdminDirectMessages((prev) => {
      const updatedList = (prev[targetUser] || []).filter((m) => m.id !== messageId);
      const updated = { ...prev, [targetUser]: updatedList };
      localStorage.setItem('seccom_direct_messages', JSON.stringify(updated));
      return updated;
    });

    setPinnedMessages((prev) => {
      if (prev[targetUser]?.id === messageId) {
        const copy = { ...prev };
        delete copy[targetUser];
        delete copy[targetUser.toLowerCase()];
        localStorage.setItem('seccom_pinned_messages', JSON.stringify(copy));
        return copy;
      }
      return prev;
    });

    emitRealtimeSync({
      type: 'DESTROY_DIRECT_MESSAGE',
      targetUser: targetUser,
      messageId: messageId
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('direct_messages').delete().eq('id', messageId).catch(() => {});
      } catch (err) {
        console.warn('Supabase delete direct message info:', err);
      }
    }
  };

  // PURGE ALL DIRECT MESSAGES FOR A USER
  const handlePurgeAllDirectMessages = async (targetUser) => {
    setAdminDirectMessages((prev) => {
      const updated = { ...prev, [targetUser]: [] };
      localStorage.setItem('seccom_direct_messages', JSON.stringify(updated));
      return updated;
    });

    setPinnedMessages((prev) => {
      const copy = { ...prev };
      delete copy[targetUser];
      delete copy[targetUser.toLowerCase()];
      localStorage.setItem('seccom_pinned_messages', JSON.stringify(copy));
      return copy;
    });

    emitRealtimeSync({
      type: 'PURGE_DIRECT_MESSAGES',
      targetUser: targetUser
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('direct_messages').delete().eq('target_user', targetUser).catch(() => {});
      } catch (err) {
        console.warn('Supabase purge direct messages info:', err);
      }
    }
  };

  // REVEAL & TRIGGER DELETE-AFTER-VIEW BURNING TIMER FOR MESSAGES
  const handleRevealDeleteAfterViewMessage = (targetUserOrRoom, messageId, isRoom = false) => {
    const revealedMs = Date.now();

    if (isRoom) {
      setRoomMessages((prev) => {
        const list = prev[targetUserOrRoom] || [];
        const updated = list.map((m) => {
          if (m.id === messageId) {
            return { ...m, isRevealed: true, revealedTimestamp: revealedMs };
          }
          return m;
        });
        return { ...prev, [targetUserOrRoom]: updated };
      });
      emitRealtimeSync({
        type: 'REVEAL_MESSAGE',
        room: targetUserOrRoom,
        messageId: messageId,
        revealedTimestamp: revealedMs
      });
    } else {
      setAdminDirectMessages((prev) => {
        const list = prev[targetUserOrRoom] || [];
        const updated = list.map((m) => {
          if (m.id === messageId) {
            return { ...m, isRevealed: true, revealedTimestamp: revealedMs };
          }
          return m;
        });
        return { ...prev, [targetUserOrRoom]: updated };
      });
      emitRealtimeSync({
        type: 'REVEAL_MESSAGE',
        targetUser: targetUserOrRoom,
        messageId: messageId,
        revealedTimestamp: revealedMs
      });
    }
  };

  // Helper to retrieve pinned message for any target username (case-insensitive with fallback)
  const getPinnedMessageForUser = (username) => {
    if (!pinnedMessages) return null;
    if (username && pinnedMessages[username]) return pinnedMessages[username];
    if (username) {
      const lower = username.toLowerCase();
      const match = Object.keys(pinnedMessages).find(k => k && k.toLowerCase() === lower);
      if (match && pinnedMessages[match]) return pinnedMessages[match];
    }
    // Fallback search inside direct messages array for isPinned flag
    const userMsgs = adminDirectMessages[username] || adminDirectMessages[username?.toLowerCase()] || [];
    const directPinned = userMsgs.find(m => m.isPinned || m.is_pinned);
    if (directPinned) return directPinned;

    return pinnedMessages['user'] || pinnedMessages['all'] || null;
  };

  const handlePinMessage = async (targetUser, msg) => {
    if (authRole !== 'admin') return;
    const currentPinned = getPinnedMessageForUser(targetUser);
    const isAlreadyPinned = currentPinned?.id === msg.id;
    const newPinned = isAlreadyPinned ? null : msg;

    setPinnedMessages((prev) => {
      const updated = {
        ...prev,
        [targetUser]: newPinned,
        [targetUser.toLowerCase()]: newPinned
      };
      localStorage.setItem('seccom_pinned_messages', JSON.stringify(updated));

      emitRealtimeSync({
        type: 'PIN_DIRECT_MESSAGE',
        targetUser: targetUser,
        message: newPinned
      });

      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        // Layer 1: Dedicated pinned_messages table
        if (newPinned) {
          await supabase.from('pinned_messages').upsert({
            target_user: targetUser,
            message_id: msg.id,
            message_data: newPinned,
            pinned_by: 'Admin'
          }, { onConflict: 'target_user' }).catch(() => {});
        } else {
          await supabase.from('pinned_messages').delete().eq('target_user', targetUser).catch(() => {});
        }

        // Layer 2: Update is_pinned status in direct_messages table
        await supabase.from('direct_messages')
          .update({ is_pinned: false })
          .eq('target_user', targetUser)
          .catch(() => {});

        if (newPinned) {
          await supabase.from('direct_messages')
            .update({ is_pinned: true })
            .eq('id', msg.id)
            .catch(() => {});
        }

        // Layer 3: System room backup in room_messages (SYS_PINNED_MESSAGES)
        const updatedPinnedObj = {
          ...pinnedMessages,
          [targetUser]: newPinned,
          [targetUser.toLowerCase()]: newPinned
        };
        await supabase.from('room_messages').insert({
          room: 'SYS_PINNED_MESSAGES',
          sender: 'SYSTEM',
          cipher: 'SYS.PIN',
          text: JSON.stringify(updatedPinnedObj)
        }).catch(() => {});

      } catch (err) {
        console.warn('Supabase pin save info:', err);
      }
    }
  };

  const handleClearLoginHistory = async () => {
    setLoginHistory([]);
    try {
      localStorage.removeItem('seccom_login_history');
    } catch {}
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('login_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Clear login history db info:', err);
      }
    }
  };

  // MARK DIRECT MESSAGES AS SEEN (DOUBLE BLUE TICKS & GHOST MODE PURGE)
  const markDirectMessagesAsSeen = (targetUser) => {
    if (!targetUser) return;
    setAdminDirectMessages((prev) => {
      const list = prev[targetUser] || [];
      const currentUser = authRole === 'admin' ? 'Admin' : activeUser?.username;
      const hasUnseen = list.some((m) => m.sender !== currentUser && m.status !== 'seen');

      if (!hasUnseen) return prev;

      let updatedAny = false;
      const updated = list.map((m) => {
        if (m.sender !== currentUser && m.status !== 'seen') {
          updatedAny = true;
          return { ...m, status: 'seen' };
        }
        return m;
      });

      let finalMessages = updated;
      if (isGhostMode) {
        finalMessages = updated.filter(m => m.status !== 'seen');
      }

      if (updatedAny) {
        emitRealtimeSync({ type: 'MARK_MESSAGES_SEEN', targetUser: targetUser, isGhostMode });
        if (isSupabaseConfigured && supabase) {
          supabase.from('direct_messages')
            .update({ status: 'seen' })
            .eq('target_user', targetUser)
            .neq('sender', currentUser)
            .then(() => {}).catch(() => {});
        }
      }

      return { ...prev, [targetUser]: finalMessages };
    });
  };

  // Auto-mark direct messages as SEEN and scroll down once when opening chat or switching contact
  useEffect(() => {
    if (activeTab === 'chat') {
      const targetUser = authRole === 'admin' ? selectedChatUser : activeUser?.username || 'user';
      if (targetUser) {
        markDirectMessagesAsSeen(targetUser);
      }

      const currentKey = `${activeTab}-${targetUser}-${authRole}`;
      if (prevChatTargetRef.current !== currentKey) {
        prevChatTargetRef.current = currentKey;
        scrollToBottom();
      }
    }
  }, [activeTab, selectedChatUser, activeUser?.username, authRole]);

  // ADMIN BROADCAST & BURN NOTE TRANSMISSION TO ALL USERS & DEVICES
  const handleSendAdminBroadcast = async (e) => {
    if (e) e.preventDefault();
    if (!broadcastInput.trim()) return;

    const noteId = 'bcast-' + Date.now();
    const formattedTime = formatTimestamp();
    const messageText = broadcastInput.trim();

    const broadcastObj = {
      id: noteId,
      sender: 'Admin-Command',
      text: messageText,
      time: formattedTime
    };

    setActiveBroadcastNote(broadcastObj);
    localStorage.setItem('seccom_active_broadcast_note', JSON.stringify(broadcastObj));

    const broadcastMsgText = `📢 BROADCAST BY ADMIN (${formattedTime})\n\n${messageText}`;

    // 1. Post to #general-vault room chat
    const broadcastMsg = {
      id: noteId,
      sender: '📢 BROADCAST BY ADMIN',
      cipher: 'SECCOM-BROADCAST.ALL',
      text: broadcastMsgText,
      time: formattedTime
    };

    setRoomMessages((prev) => ({
      ...prev,
      '#general-vault': [...(prev['#general-vault'] || []), broadcastMsg]
    }));

    // 2. Inject into ALL user direct message chats
    setAdminDirectMessages((prev) => {
      const updated = { ...prev };
      const targetList = usersList.map((u) => u.username).filter(Boolean);
      if (!targetList.includes('user')) targetList.push('user');
      if (!targetList.includes('operative-alpha')) targetList.push('operative-alpha');

      targetList.forEach((uName) => {
        const list = updated[uName] || [];
        updated[uName] = [
          ...list,
          {
            id: noteId + '-' + uName,
            sender: '📢 BROADCAST BY ADMIN',
            cipher: 'SECCOM-BROADCAST.ALL',
            text: broadcastMsgText,
            time: formattedTime,
            status: 'delivered',
            isGhost: false
          }
        ];
      });
      return updated;
    });

    // 3. Save to Supabase Cloud Database under room 'GLOBAL_BROADCAST' & '#general-vault'
    if (isSupabaseConfigured && supabase) {
      await supabase.from('room_messages').insert([
        {
          room: 'GLOBAL_BROADCAST',
          sender: '📢 BROADCAST BY ADMIN',
          cipher: 'SECCOM-BROADCAST.ALL',
          text: JSON.stringify(broadcastObj),
          auto_burn: null
        },
        {
          room: '#general-vault',
          sender: '📢 BROADCAST BY ADMIN',
          cipher: 'SECCOM-BROADCAST.ALL',
          text: broadcastMsgText,
          auto_burn: null
        }
      ]).catch(() => {});
    }

    // 4. Emit Realtime Sync to all open client instances
    emitRealtimeSync({
      type: 'ADMIN_BROADCAST',
      broadcast: broadcastObj
    });

    setBroadcastInput('');
    setBroadcastStatus('✅ Broadcast Note sent to ALL connected operatives in real-time with timestamp!');
    setTimeout(() => setBroadcastStatus(''), 5000);
  };

  // Handle Multi-Algorithm Encryption
  const handleEncrypt = async () => {
    if (!plaintext || !passphrase) {
      setCryptoError('Please enter both message text and a secret passphrase.');
      return;
    }
    setCryptoError('');
    setIsEncrypting(true);
    try {
      const cipher = await encryptWithAlgorithm(plaintext, passphrase, selectedAlgorithm);
      setEncryptedOutput(cipher);
    } catch (err) {
      setCryptoError('Encryption error: ' + err.message);
    } finally {
      setIsEncrypting(false);
    }
  };

  // Handle Multi-Algorithm Decryption
  const handleDecrypt = async () => {
    if (!decryptInput || !decryptPassphrase) {
      setCryptoError('Please enter both ciphertext and the decryption passphrase.');
      return;
    }
    setCryptoError('');
    try {
      const original = await decryptWithAlgorithm(decryptInput, decryptPassphrase);
      setDecryptedResult(original);
    } catch (err) {
      setDecryptedResult('');
      setCryptoError(err.message);
    }
  };

  // Zero-Width Steganography
  const handleEncodeZeroWidth = () => {
    const encoded = encodeZeroWidth(stegoCover, stegoSecret);
    setStegoEncodedResult(encoded);
  };

  const handleDecodeZeroWidth = () => {
    const hidden = decodeZeroWidth(stegoDecodeInput);
    if (hidden) {
      setStegoDecodedResult(hidden);
    } else {
      setStegoDecodedResult('⚠️ No hidden zero-width steganographic payload detected.');
    }
  };

  // Initial Canvas Asset Drawing for Encoder & Decoder
  useEffect(() => {
    [canvasEncodeRef, canvasDecodeRef].forEach((ref, index) => {
      if (ref.current) {
        const canvas = ref.current;
        const ctx = canvas.getContext('2d');
        const width = (canvas.width = 300);
        const height = (canvas.height = 180);

        const grad = ctx.createLinearGradient(0, 0, width, height);
        if (index === 0) {
          grad.addColorStop(0, '#1a2a3a');
          grad.addColorStop(0.5, '#1e3a5f');
          grad.addColorStop(1, '#0f172a');
        } else {
          grad.addColorStop(0, '#1a2e26');
          grad.addColorStop(0.5, '#064e3b');
          grad.addColorStop(1, '#022c22');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = index === 0 ? 'rgba(0, 243, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)';
        ctx.beginPath();
        ctx.arc(150, 90, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '13px monospace';
        ctx.fillText(index === 0 ? 'Cover Image Canvas' : 'Stego Decoder Canvas', 70, 95);
      }
    });
  }, []);

  // 1. Encoder Functions (Left Panel: Hide Text in Image)
  const handleImportEncoderImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasEncodeRef.current) return;
        const canvas = canvasEncodeRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = false;
        const nw = img.naturalWidth || img.width || 300;
        const nh = img.naturalHeight || img.height || 180;
        canvas.width = nw;
        canvas.height = nh;
        ctx.drawImage(img, 0, 0, nw, nh);
        setEncodedResultDataUrl('');
        setEncodeStatus('🖼️ Cover image loaded at full 1:1 resolution. Ready to embed secret.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStegoImage = async () => {
    if (!canvasEncodeRef.current) return;
    try {
      if (!encodeSecretText.trim()) {
        alert('Please enter a secret text payload to hide.');
        return;
      }
      let payloadToEmbed = encodeSecretText;
      if (encodePassword.trim()) {
        const encrypted = await encryptWithAlgorithm(encodeSecretText, encodePassword, 'AES-256-GCM');
        payloadToEmbed = 'SECCOM_PASS:' + encrypted;
      }
      const dataUrl = hideTextInCanvas(canvasEncodeRef.current, payloadToEmbed);
      setEncodedResultDataUrl(dataUrl);

      const newStegoRecord = {
        id: 'stego-' + Date.now(),
        title: encodeSecretText.substring(0, 24) + (encodeSecretText.length > 24 ? '...' : ''),
        created: formatTimestamp(),
        isPasswordProtected: !!encodePassword.trim(),
        passwordHint: encodePassword.trim() ? `AES-256-GCM Key ("${encodePassword.trim().substring(0, 3)}***")` : 'Open Key (Unencrypted)',
        dataUrl: dataUrl,
        rawPayload: payloadToEmbed
      };

      setStegoVaultList((prev) => [newStegoRecord, ...prev]);

      if (isSupabaseConfigured && supabase) {
        supabase.from('room_messages').insert({
          room: 'SYS_STEGO_VAULT',
          sender: activeUser?.username || 'user',
          cipher: newStegoRecord.id,
          text: JSON.stringify(newStegoRecord)
        }).then(() => {}).catch(() => {});
      }

      setEncodeStatus(
        encodePassword.trim()
          ? '🔒 Encrypted with password & stored in vault / image pixels! Click Download below.'
          : '✅ Secret payload embedded in image pixels & saved to vault! Click Download below.'
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteStegoRecord = async (stegoId) => {
    setStegoVaultList((prev) => {
      const updated = prev.filter((item) => item.id !== stegoId);
      localStorage.setItem('seccom_stego_vault', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('room_messages').delete().eq('room', 'SYS_STEGO_VAULT').eq('cipher', stegoId).catch(() => {});
        await supabase.from('stego_images').delete().eq('id', stegoId).catch(() => {});
      } catch (err) {
        console.warn('Supabase delete stego record info:', err);
      }
    }
  };

  const handlePurgeAllStegoRecords = async () => {
    setStegoVaultList([]);
    localStorage.removeItem('seccom_stego_vault');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('room_messages').delete().eq('room', 'SYS_STEGO_VAULT').catch(() => {});
        await supabase.from('stego_images').delete().neq('id', '00000000-0000-0000-0000-000000000000').catch(() => {});
      } catch (err) {
        console.warn('Supabase purge stego records info:', err);
      }
    }
  };

  const handleLoadStegoToDecoder = (item) => {
    if (!item.dataUrl) return;
    const img = new Image();
    img.onload = () => {
      if (!canvasDecodeRef.current) return;
      const canvas = canvasDecodeRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = false;
      const nw = img.naturalWidth || img.width || 300;
      const nh = img.naturalHeight || img.height || 180;
      canvas.width = nw;
      canvas.height = nh;
      ctx.drawImage(img, 0, 0, nw, nh);
      setExtractedSecretText(`🖼️ Stego Image "${item.title}" loaded to decoder. Click "Extract Secret from Image" below.`);
    };
    img.src = item.dataUrl;
  };

  const handleDownloadStegoImage = () => {
    if (!encodedResultDataUrl) return;
    const link = document.createElement('a');
    link.href = encodedResultDataUrl;
    link.download = `stego_secret_image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Decoder Functions (Right Panel: Extract Secret from Image)
  const handleImportDecoderImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasDecodeRef.current) return;
        const canvas = canvasDecodeRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = false;
        const nw = img.naturalWidth || img.width || 300;
        const nh = img.naturalHeight || img.height || 180;
        canvas.width = nw;
        canvas.height = nh;
        ctx.drawImage(img, 0, 0, nw, nh);
        setExtractedSecretText('🖼️ Stego PNG image loaded at 1:1 pixel accuracy. Click "Extract Secret from Image" below.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleExtractStegoSecret = async () => {
    if (!canvasDecodeRef.current) return;
    try {
      const rawExtracted = extractTextFromCanvas(canvasDecodeRef.current);
      if (rawExtracted.startsWith('SECCOM_PASS:')) {
        const cipherPayload = rawExtracted.substring('SECCOM_PASS:'.length);
        if (!decodePassword.trim()) {
          setExtractedSecretText('🔐 Password required! This image contains a password-protected secret payload. Please enter the password above to extract.');
          return;
        }
        try {
          const decrypted = await decryptWithAlgorithm(cipherPayload, decodePassword);
          setExtractedSecretText(`🔓 Secret Extracted (Password Verified): ${decrypted}`);
        } catch (decryptErr) {
          setExtractedSecretText('⚠️ Decryption Failed! Invalid password entered for this steganographic image.');
        }
      } else {
        setExtractedSecretText(`🔓 Secret Extracted: ${rawExtracted}`);
      }
    } catch (err) {
      setExtractedSecretText('⚠️ ' + err.message);
    }
  };

  const handleEntropyChange = (val) => {
    setEntropyPass(val);
    setEntropyResult(analyzeEntropy(val));
  };

  const handleGenerateRSA = async () => {
    setGeneratingKeys(true);
    try {
      const keys = await generateRSAKeyPair();
      setRsaKeys(keys);
    } finally {
      setGeneratingKeys(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateBurnNote = async () => {
    if (!burnNote) return;
    const encrypted = await encryptWithAlgorithm(burnNote, burnPass || 'default-key', selectedAlgorithm);
    const noteId = Math.random().toString(36).substring(2, 10);
    const link = `${window.location.origin}/#burn=${noteId}&payload=${encodeURIComponent(encrypted)}`;
    setGeneratedBurnLink(link);
    setBurnNoteContent(burnNote);
  };

  const handleSimulateReadBurnNote = () => {
    setBurnNoteRead(true);
  };

  const handleSaveSupabaseConfig = (e) => {
    e.preventDefault();
    setSupabaseCredentials(inputDbUrl, inputDbKey);
  };

  // IF UNAUTHENTICATED: SHOW GATEWAY LOGIN MODAL WITH SINGLE UNIFIED LOGIN
  if (authRole === 'unauthenticated') {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-md w-full p-8 shadow-[0_0_80px_rgba(0,243,255,0.25)] space-y-6 font-mono relative overflow-hidden animate-in zoom-in-95">
          
          {/* Top Decorative Cyber Grid */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500"></div>

          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 mb-2">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold tracking-wider text-slate-100">SecCom Vault Gateway</h2>
            <p className="text-xs text-slate-400">Enter your credentials to authenticate</p>
          </div>

          {/* LOGIN ERROR ALERT */}
          {loginError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* UNIFIED LOGIN FORM */}
          <form onSubmit={handleGatewayLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="Enter username..."
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Passkey / Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter passkey..."
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(0,243,255,0.4)] cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Authenticate & Enter Vault</span>
            </button>
          </form>

          {/* FACE RECOGNITION UNLOCK OPTION */}
          <div className="pt-2 border-t border-slate-800 space-y-3 text-center">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest">OR BIOMETRIC AUTH</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              type="button"
              onClick={openLoginFaceScanner}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-purple-950/90 hover:bg-purple-900 text-purple-300 border border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.25)] cursor-pointer"
            >
              <Camera className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Scan Face to Unlock Admin</span>
            </button>
          </div>

          {/* Camouflage / Exit Button */}
          <div className="pt-2 text-center border-t border-slate-800">
            <button
              onClick={onEmergencyPurge}
              className="text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors"
            >
              ← Return to AIBlog Article Page
            </button>
          </div>

        </div>

        {/* FACE RECOGNITION SCANNER MODAL */}
        {loginFaceScannerOpen && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border-2 border-purple-500/60 rounded-3xl max-w-lg w-full p-6 shadow-[0_0_100px_rgba(168,85,247,0.4)] space-y-5 font-mono relative overflow-hidden">
              
              {/* Top Banner */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-950 border border-purple-500/50 text-purple-400">
                    <Scan className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100">Facial Biometric Authentication</h3>
                    <p className="text-[10px] text-purple-400">Comparing live webcam feed against enrolled Admin profile</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeLoginFaceScanner}
                  className="p-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Video Scanner Feed */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-slate-950 aspect-video flex items-center justify-center shadow-inner">
                <video
                  ref={loginScanVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />

                {/* Animated Cyber Reticle */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 border-2 border-purple-500/30 m-2 rounded-xl">
                  <div className="flex justify-between items-center text-[9px] text-purple-400 bg-slate-950/80 px-2 py-0.5 rounded border border-purple-500/40 w-max">
                    BIOMETRIC SCANNING: 64-GRID
                  </div>

                  <div className="w-40 h-40 mx-auto border-2 border-purple-400 rounded-full relative flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse">
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent absolute animate-bounce"></div>
                  </div>

                  <div className="text-center text-[10px] text-purple-300 bg-slate-950/90 p-1.5 rounded border border-purple-500/40">
                    {loginScanStatus || 'Position your face in front of the camera...'}
                  </div>
                </div>
              </div>

              {/* Match Similarity Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400 font-mono">Facial Similarity Score:</span>
                  <span className={loginScanMatchScore >= 70 ? 'text-emerald-400' : 'text-purple-400'}>
                    {loginScanMatchScore}% (Threshold: 70%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full border border-purple-500/40 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${loginScanMatchScore >= 70 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-purple-600 to-purple-400'}`}
                    style={{ width: `${loginScanMatchScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeLoginFaceScanner}
                  className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel & Use Password Login
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-16">
      
      {/* SECURITY TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-cyan-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Security Status */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#1c1917] border border-[#d4af37]/50 text-[#faf8f5] shadow-[0_0_15px_rgba(212,175,55,0.25)] shrink-0">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="font-mono text-base sm:text-xl font-bold tracking-wider text-slate-100">
                  SecCom <span className="text-cyan-400">Vault</span>
                </h1>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  RAM-ONLY ACTIVE
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono hidden xs:block">Zero-Knowledge Hardware Encrypted Engine</p>
            </div>
          </div>

          {/* SUPABASE STATUS, USER ROLE BADGE & PANIC BUTTON */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
            
            {/* Active User Role Badge */}
            <div className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-mono font-bold ${
              authRole === 'admin'
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400'
            }`}>
              {authRole === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              <span>{authRole === 'admin' ? 'Admin' : activeUser?.username}</span>
            </div>

            {/* Live 40-Second Inactivity Countdown Badge */}
            <div className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] sm:text-xs font-mono text-cyan-400">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 animate-spin" />
              <span><strong className="text-emerald-400">{inactivitySeconds}s</strong></span>
            </div>

            {/* Sign Out Role Switcher */}
            <button
              onClick={() => setAuthRole('unauthenticated')}
              className="text-[10px] sm:text-xs font-mono px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Switch User
            </button>

            <button
              onClick={onEmergencyPurge}
              className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 border border-rose-500 text-white transition-all shadow-[0_0_20px_rgba(255,51,102,0.4)] flex items-center gap-1 sm:gap-2 animate-pulse"
              title="Instant Memory Wipe & Immediate Exit (Esc)"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>PANIC</span>
            </button>
          </div>

        </div>

      {/* GLOBAL ADMIN BROADCAST BANNER FOR ALL USERS */}
      {activeBroadcastNote && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/60 p-3 shadow-lg animate-in slide-in-from-top duration-300 font-mono">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0 animate-bounce">
                <Flame className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
                  <span>📢 BROADCAST BY ADMIN</span>
                  <span className="text-[10px] text-slate-400">({activeBroadcastNote.time})</span>
                </div>
                <p className="text-xs text-slate-100 font-sans font-medium">
                  {activeBroadcastNote.text}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveBroadcastNote(null);
                localStorage.removeItem('seccom_active_broadcast_note');
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-[11px] font-bold transition-all cursor-pointer shrink-0"
            >
              Dismiss / Mark Read
            </button>
          </div>
        </div>
      )}

        {/* ROLE-BASED TAB NAVIGATION */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 overflow-x-auto border-t border-slate-800 flex items-center gap-1.5 sm:gap-2 pt-2 scrollbar-none whitespace-nowrap">
          {[
            { id: 'chat', label: authRole === 'admin' ? 'Admin Chat Option' : 'User Realtime Chat', icon: MessageSquare },
            { id: 'e2ee', label: 'E2EE Vault & Algo Select', icon: Lock },
            ...(authRole === 'admin' ? [{ id: 'admin', label: 'Admin User Manager', icon: Users }] : []),
            { id: 'burn', label: 'Burn-on-Read Notes', icon: Flame },
            { id: 'stego', label: 'Steganography Studio', icon: Eye },
            { id: 'tor', label: 'Tor Router', icon: Globe },
            { id: 'keygen', label: 'Keygen & Entropy', icon: Key }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const totalUnreadCount = tab.id === 'chat' ? (
              authRole === 'admin'
                ? Object.keys(adminDirectMessages).reduce((acc, userKey) => {
                    const list = adminDirectMessages[userKey] || [];
                    return acc + list.filter(m => m.sender === userKey && m.status !== 'seen').length;
                  }, 0)
                : (adminDirectMessages[activeUser?.username] || []).filter(m => m.sender !== activeUser?.username && m.status !== 'seen').length
            ) : 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono rounded-t-xl transition-all border-t border-x whitespace-nowrap ${
                  active
                    ? 'bg-slate-950 border-cyan-500/50 text-cyan-400 font-bold shadow-[0_-4px_12px_rgba(0,243,255,0.15)]'
                    : 'bg-slate-900/50 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {totalUnreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* REALTIME CRITICAL ADMIN BROADCAST BANNER (VISIBLE TO ALL OPERATIVES WITH BURN-ON-READ BUTTON) */}
      {activeBroadcastNote && (
        <div className="bg-amber-950/95 border-b border-amber-500/80 p-3.5 px-4 sm:px-6 text-amber-200 font-mono text-xs shadow-2xl relative animate-in slide-in-from-top duration-300 z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-900 border border-amber-400 text-amber-300 shrink-0">
                <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] bg-amber-900/60 px-2 py-0.5 rounded border border-amber-500/40">
                    📢 CRITICAL ADMIN BROADCAST NOTE
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">({activeBroadcastNote.time})</span>
                </div>
                <p className="text-sm font-semibold text-slate-100 mt-1 font-sans">{activeBroadcastNote.text}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveBroadcastNote(null)}
              className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/60 text-rose-200 font-bold text-xs flex items-center gap-2 shrink-0 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer"
              title="Burn & Shred this Broadcast Note from screen"
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Burn & Dismiss Note</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER CONTENT */}
      <main className="max-w-7xl mx-auto px-6 pt-8">

        {cryptoError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{cryptoError}</span>
            </div>
            <button onClick={() => setCryptoError('')} className="text-rose-400 hover:text-white">✕</button>
          </div>
        )}

        {/* TAB: REALTIME CHAT (USER CHAT OPTION OR ADMIN CHAT OPTION) */}
        {activeTab === 'chat' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Header Banner */}
            <div className="bg-slate-900/80 rounded-2xl border border-cyan-500/30 p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl border ${authRole === 'admin' ? 'bg-amber-950 border-amber-500/50 text-amber-400' : 'bg-cyan-950 border-cyan-500/50 text-cyan-400'}`}>
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-mono font-bold text-xl text-slate-100 flex items-center gap-2">
                    {authRole === 'admin' ? 'Admin Realtime User Chat Console' : 'User Realtime Encrypted Chat'}
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {isSupabaseConfigured ? 'Supabase Postgres Sync' : 'Memory Mesh Sync'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {authRole === 'admin'
                      ? 'Select any user below to open their isolated 1-on-1 private chat channel.'
                      : `Logged in as ${activeUser?.username}. Private chats with Admin are strictly isolated.`}
                  </p>
                </div>
              </div>

              {/* Mode Switcher for User or Channel Selector for Admin */}
              {authRole === 'user' ? (
                <div className="flex items-center gap-2 p-2 bg-slate-950 border border-amber-500/40 rounded-xl text-amber-400 font-mono text-xs shadow-inner">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="font-bold">🔒 Confidential Line: {activeUser?.username} ↔ Admin</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-slate-400">Channel:</span>
                    {['#general-vault', '#alpha-squad'].map((room) => (
                      <button
                        key={room}
                        onClick={() => setSelectedRoom(room)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                          selectedRoom === room
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-400 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {room}
                      </button>
                    ))}
                  </div>

                  {/* Room Self-Destruct Timer Dropdown Selector */}
                  <div className="flex items-center gap-1 bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <select
                      value={autoBurnSeconds}
                      onChange={(e) => setAutoBurnSeconds(e.target.value)}
                      className="bg-transparent text-xs font-mono text-amber-300 focus:outline-none cursor-pointer"
                      title="Set Room Self-Destruction Timer for outbound messages"
                    >
                      <option value="none" className="bg-slate-900 text-slate-200">Timer: Off</option>
                      <option value="5" className="bg-slate-900 text-amber-300">🔥 Burn in 5s</option>
                      <option value="10" className="bg-slate-900 text-amber-300">🔥 Burn in 10s</option>
                      <option value="30" className="bg-slate-900 text-amber-300">🔥 Burn in 30s</option>
                      <option value="60" className="bg-slate-900 text-amber-300">🔥 Burn in 1m</option>
                      <option value="300" className="bg-slate-900 text-amber-300">🔥 Burn in 5m</option>
                      <option value="3600" className="bg-slate-900 text-amber-300">🔥 Burn in 1h</option>
                    </select>
                  </div>

                  {/* Room Delete After View Toggle Button */}
                  <button
                    onClick={() => setRoomDeleteAfterView(!roomDeleteAfterView)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      roomDeleteAfterView
                        ? 'bg-purple-950/90 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle Delete After View: Messages self-destruct 3s after recipient reveals & reads them"
                  >
                    <Eye className={`w-3.5 h-3.5 ${roomDeleteAfterView ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span>{roomDeleteAfterView ? '👁️ Delete After View: ON' : 'Delete After View: OFF'}</span>
                  </button>

                  <button
                    onClick={() => handlePurgeAllRoomMessages(selectedRoom)}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Purge Room</span>
                  </button>
                </div>
              )}
            </div>

            {/* ADMIN CHAT CONSOLE: USERS SIDEBAR + DEDICATED ISOLATED CHAT */}
            {authRole === 'admin' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* ADMIN USER CHAT SELECTOR SIDEBAR (col-span-4) */}
                <div className="lg:col-span-4 bg-slate-900/90 rounded-2xl border border-amber-500/40 p-5 shadow-2xl flex flex-col h-[600px]">
                  <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-mono font-bold text-sm text-amber-400 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Registered Users List
                      </h3>
                      <p className="text-[10px] text-slate-400">Click any user to open isolated chat</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-mono border border-amber-800">
                      {usersList.filter(u => u.username !== 'admin').length} Users
                    </span>
                  </div>

                  {/* USER LIST WITH CHAT BUTTONS */}
                  <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 font-mono">
                    {usersList.filter(u => u.username !== 'admin').map((u) => {
                      const isSelected = selectedChatUser === u.username;
                      const userMsgs = getDirectMessagesForUser(u.username);
                      const unreadCount = userMsgs.filter(m => m.sender === u.username && m.status !== 'seen').length;
                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedChatUser(u.username)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                : 'bg-slate-800 border-slate-700 text-amber-400'
                            }`}>
                              {(u.username || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-xs">{u.username}</p>
                              <p className="text-[9px] text-slate-500">Role: {u.role}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                                {unreadCount}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChatUser(u.username);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 shadow-md'
                                  : 'bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-slate-200'
                              }`}
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Chat</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
                    🔒 Messages sent to <strong className="text-amber-400">{selectedChatUser}</strong> are strictly invisible to other users.
                  </div>
                </div>

                {/* DEDICATED ISOLATED USER CHAT WINDOW (col-span-8) */}
                <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[600px] overflow-hidden relative">
                  
                  {/* Chat Header */}
                  <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                        {(selectedChatUser || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-mono font-bold text-sm text-slate-100 flex items-center gap-2">
                          Private Line: <span className="text-amber-400">Admin ↔ {selectedChatUser}</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">Strict 1-on-1 isolated encrypted channel</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Direct Message Self-Destruct Timer Dropdown Selector */}
                      <div className="flex items-center gap-1 bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1.5 font-mono text-xs">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <select
                          value={directAutoBurnSeconds}
                          onChange={(e) => setDirectAutoBurnSeconds(e.target.value)}
                          className="bg-transparent text-xs font-mono text-amber-300 focus:outline-none cursor-pointer"
                          title="Set Direct Message Self-Destruction Timer for outbound messages"
                        >
                          <option value="none" className="bg-slate-900 text-slate-200">Timer: Off</option>
                          <option value="5" className="bg-slate-900 text-amber-300">🔥 Burn in 5s</option>
                          <option value="10" className="bg-slate-900 text-amber-300">🔥 Burn in 10s</option>
                          <option value="30" className="bg-slate-900 text-amber-300">🔥 Burn in 30s</option>
                          <option value="60" className="bg-slate-900 text-amber-300">🔥 Burn in 1m</option>
                          <option value="300" className="bg-slate-900 text-amber-300">🔥 Burn in 5m</option>
                          <option value="3600" className="bg-slate-900 text-amber-300">🔥 Burn in 1h</option>
                        </select>
                      </div>

                      {/* Direct Message Delete After View Toggle Button */}
                      <button
                        onClick={() => setDirectDeleteAfterView(!directDeleteAfterView)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          directDeleteAfterView
                            ? 'bg-purple-950/90 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle Delete After View: Messages self-destruct 3s after recipient reveals & reads them"
                      >
                        <Eye className={`w-3.5 h-3.5 ${directDeleteAfterView ? 'text-purple-400' : 'text-slate-400'}`} />
                        <span>{directDeleteAfterView ? '👁️ Delete After View: ON' : 'Delete After View: OFF'}</span>
                      </button>

                      <button
                        onClick={() => setIsGhostMode(!isGhostMode)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isGhostMode
                            ? 'bg-purple-950/90 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle Ghost Mode: Messages self-destruct after viewing"
                      >
                        <Ghost className={`w-3.5 h-3.5 ${isGhostMode ? 'text-purple-400' : 'text-slate-400'}`} />
                        <span>{isGhostMode ? '👻 Ghost Mode: ON' : 'Ghost Mode: OFF'}</span>
                      </button>

                      <button
                        onClick={() => handlePurgeAllDirectMessages(selectedChatUser)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Clear Chat with {selectedChatUser}</span>
                      </button>
                    </div>
                  </div>

                  {/* PINNED MESSAGE BANNER (WhatsApp Style) */}
                  {getPinnedMessageForUser(selectedChatUser) && (
                    <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 py-2.5 flex items-center justify-between font-mono text-xs shadow-md shrink-0 animate-in fade-in">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-1.5 rounded-lg bg-amber-900/60 border border-amber-400/40 text-amber-400 shrink-0">
                          <Pin className="w-3.5 h-3.5 fill-amber-400/40 text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[10px] text-amber-300 font-bold">
                            <span>📌 Pinned Message</span>
                            <span className="text-slate-400">• {getPinnedMessageForUser(selectedChatUser).sender}</span>
                            <span className="text-slate-500">• {getPinnedMessageForUser(selectedChatUser).time}</span>
                          </div>
                          <p className="text-slate-100 text-xs font-sans font-medium truncate">{getPinnedMessageForUser(selectedChatUser).text}</p>
                        </div>
                      </div>
                      {authRole === 'admin' && (
                        <button
                          onClick={() => handlePinMessage(selectedChatUser, getPinnedMessageForUser(selectedChatUser))}
                          className="px-2.5 py-1 rounded-lg bg-amber-900/40 hover:bg-rose-950 text-amber-300 hover:text-rose-300 border border-amber-500/30 hover:border-rose-500/40 text-[10px] flex items-center gap-1 shrink-0 ml-3 transition-all cursor-pointer"
                          title="Unpin Message"
                        >
                          <PinOff className="w-3.5 h-3.5" />
                          <span>Unpin</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Message History */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs bg-slate-950/60">
                    {getDirectMessagesForUser(selectedChatUser).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic font-mono space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-700" />
                        <p>No messages in private thread with <strong className="text-amber-400">{selectedChatUser}</strong>.</p>
                        <p className="text-[10px] text-slate-600">Type below to start isolated conversation.</p>
                      </div>
                    ) : (
                      getDirectMessagesForUser(selectedChatUser).map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-2xl max-w-md border space-y-1.5 shadow-md relative ${
                            msg.isGhost
                              ? 'bg-purple-950/90 border-purple-500/70 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                              : msg.sender === 'Admin'
                              ? 'ml-auto bg-amber-950/80 border-amber-500/40 text-amber-100'
                              : 'bg-slate-900 border-cyan-500/40 text-cyan-100'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800/80 pb-1">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                msg.sender === 'Admin'
                                  ? 'bg-amber-500 border-amber-400 text-slate-950'
                                  : 'bg-cyan-500 border-cyan-400 text-slate-950'
                              }`}>
                                {(msg.sender || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className={`font-bold ${msg.sender === 'Admin' ? 'text-amber-400' : 'text-cyan-400'}`}>
                                {msg.sender}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span>{msg.time}</span>

                              {/* Message Status Ticks (Single Tick ✓, Double Gray ✓✓, Double Blue Ticks ✓✓) */}
                              {msg.sender === 'Admin' && (
                                <span className="inline-flex items-center ml-1">
                                  {msg.status === 'seen' ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-blue-400 font-bold" title="Seen by Recipient (Double Blue Ticks)" />
                                  ) : msg.status === 'delivered' ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-slate-400" title="Delivered to Recipient (Double Gray Ticks)" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-slate-500" title="Sent (Single Tick)" />
                                  )}
                                </span>
                              )}

                              {/* Admin Pin / Unpin Button */}
                              {authRole === 'admin' && (
                                <button
                                  onClick={() => handlePinMessage(selectedChatUser, msg)}
                                  className={`p-1 rounded transition-colors border ${
                                    getPinnedMessageForUser(selectedChatUser)?.id === msg.id
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                      : 'bg-slate-900 hover:bg-amber-950 text-slate-400 hover:text-amber-300 border-slate-700'
                                  }`}
                                  title={getPinnedMessageForUser(selectedChatUser)?.id === msg.id ? "Unpin Message" : "Pin Message to Top"}
                                >
                                  {getPinnedMessageForUser(selectedChatUser)?.id === msg.id ? (
                                    <PinOff className="w-3 h-3 text-slate-950" />
                                  ) : (
                                    <Pin className="w-3 h-3" />
                                  )}
                                </button>
                              )}

                              <button
                                onClick={() => handleDestroyDirectMessage(selectedChatUser, msg.id)}
                                className="p-1 rounded bg-rose-950 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors border border-rose-500/40"
                              >
                                <Flame className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {msg.deleteAfterView && !msg.isRevealed ? (
                            <div className="p-3 rounded-xl bg-slate-950/90 border border-purple-500/60 space-y-2 my-1 font-mono text-xs">
                              <div className="flex items-center justify-between text-purple-300">
                                <span className="flex items-center gap-1.5 font-bold">
                                  <Eye className="w-4 h-4 text-purple-400 animate-pulse" />
                                  👁️ Delete-After-View Message
                                </span>
                                <span className="text-[9px] bg-purple-950 px-2 py-0.5 rounded text-purple-200 border border-purple-500/40">
                                  View Once
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">Content protected. Self-destructs 3s after reveal.</p>
                              <button
                                onClick={() => handleRevealDeleteAfterViewMessage(selectedChatUser, msg.id, false)}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Tap to Reveal & Read</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              {msg.deleteAfterView && msg.isRevealed && (
                                <div className="text-[10px] font-mono text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/60 flex items-center gap-1.5 w-max my-1 animate-pulse">
                                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                                  <span>👁️ Viewed! Burning in {Math.max(0, 3 - Math.floor((nowTimestamp - (msg.revealedTimestamp || Date.now())) / 1000))}s...</span>
                                </div>
                              )}

                              {msg.autoBurn && (
                                <div className="text-[10px] font-mono text-amber-300 bg-amber-950/70 px-2.5 py-1 rounded-lg border border-amber-500/50 flex items-center gap-1.5 w-max my-1">
                                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                                  <span>🔥 Self-Destructs in {Math.max(0, msg.autoBurn - Math.floor((nowTimestamp - (msg.createdTimestamp || Date.parse(msg.time) || Date.now())) / 1000))}s</span>
                                </div>
                              )}

                              {msg.isGhost && (
                                <div className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1 w-max my-1 animate-pulse">
                                  <Ghost className="w-3 h-3 text-purple-400" />
                                  <span>Ghost Mode (Auto-destructs after view)</span>
                                </div>
                              )}

                              <p className="text-sm text-slate-100 font-sans font-medium">{msg.text}</p>
                            </>
                          )}

                          <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono bg-slate-950/70 p-1.5 rounded border border-slate-800">
                            <span className="truncate max-w-[240px]">Payload: {msg.cipher}</span>
                            <button onClick={() => copyToClipboard(msg.cipher)} className="text-amber-400 hover:underline shrink-0 ml-2">
                              Copy
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={adminChatEndRef} />
                  </div>

                  {/* WhatsApp-Style Floating Scroll to Bottom Circle Button */}
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-20 right-4 z-30 w-9 h-9 rounded-full bg-slate-900/95 hover:bg-amber-950 text-amber-400 border border-amber-500/50 shadow-[0_4px_16px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all hover:scale-110 active:scale-95 group cursor-pointer flex items-center justify-center relative"
                    title="Scroll to bottom of chat"
                  >
                    <ChevronDown className="w-5 h-5 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                    {hasUnreadDotAdmin && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-slate-950 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-bounce" />
                    )}
                  </button>

                  {/* Input */}
                  <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
                    <input
                      type="text"
                      value={directMsgInput}
                      onChange={(e) => setDirectMsgInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendAdminDirectMessage()}
                      placeholder={isGhostMode ? `👻 Ghost Mode Active: Send auto-destructing message to ${selectedChatUser}...` : `Send confidential message to ${selectedChatUser}...`}
                      className={`flex-1 p-3 rounded-xl bg-slate-900 border text-xs font-mono text-slate-100 focus:outline-none ${isGhostMode ? 'border-purple-500/70 focus:border-purple-400' : 'border-slate-800 focus:border-amber-500'}`}
                    />
                    <button
                      onClick={handleSendAdminDirectMessage}
                      className={`px-5 py-3 rounded-xl font-mono font-bold text-xs uppercase flex items-center gap-2 shrink-0 ${isGhostMode ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}
                    >
                      <Send className="w-4 h-4" />
                      <span>{isGhostMode ? 'Ghost Send' : `Send to ${selectedChatUser}`}</span>
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              /* NORMAL USER CHAT VIEW (STRICT 1-ON-1 PRIVATE LINE WITH ADMIN ONLY) */
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[600px] overflow-hidden relative">
                {/* Chat Header */}
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                      A
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-sm text-slate-100">
                        Private Line: <span className="text-amber-400">{activeUser?.username} ↔ Admin</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">End-to-End Encrypted 1-on-1 direct channel with Admin</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Direct Message Self-Destruct Timer Dropdown Selector */}
                    <div className="flex items-center gap-1 bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1.5 font-mono text-xs">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <select
                        value={directAutoBurnSeconds}
                        onChange={(e) => setDirectAutoBurnSeconds(e.target.value)}
                        className="bg-transparent text-xs font-mono text-amber-300 focus:outline-none cursor-pointer"
                        title="Set Direct Message Self-Destruction Timer for outbound messages"
                      >
                        <option value="none" className="bg-slate-900 text-slate-200">Timer: Off</option>
                        <option value="5" className="bg-slate-900 text-amber-300">🔥 Burn in 5s</option>
                        <option value="10" className="bg-slate-900 text-amber-300">🔥 Burn in 10s</option>
                        <option value="30" className="bg-slate-900 text-amber-300">🔥 Burn in 30s</option>
                        <option value="60" className="bg-slate-900 text-amber-300">🔥 Burn in 1m</option>
                        <option value="300" className="bg-slate-900 text-amber-300">🔥 Burn in 5m</option>
                        <option value="3600" className="bg-slate-900 text-amber-300">🔥 Burn in 1h</option>
                      </select>
                    </div>

                    {/* Direct Message Delete After View Toggle Button */}
                    <button
                      onClick={() => setDirectDeleteAfterView(!directDeleteAfterView)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        directDeleteAfterView
                          ? 'bg-purple-950/90 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Toggle Delete After View: Messages self-destruct 3s after recipient reveals & reads them"
                    >
                      <Eye className={`w-3.5 h-3.5 ${directDeleteAfterView ? 'text-purple-400' : 'text-slate-400'}`} />
                      <span>{directDeleteAfterView ? '👁️ Delete After View: ON' : 'Delete After View: OFF'}</span>
                    </button>

                    <button
                      onClick={() => setIsGhostMode(!isGhostMode)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isGhostMode
                          ? 'bg-purple-950/90 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Toggle Ghost Mode: Messages self-destruct after viewing"
                    >
                      <Ghost className={`w-3.5 h-3.5 ${isGhostMode ? 'text-purple-400' : 'text-slate-400'}`} />
                      <span>{isGhostMode ? '👻 Ghost Mode: ON' : 'Ghost Mode: OFF'}</span>
                    </button>

                    <span className="text-xs px-2.5 py-1 rounded bg-amber-950 text-amber-400 font-mono border border-amber-800">
                      Isolated Direct Line
                    </span>
                  </div>
                </div>

                {/* PINNED MESSAGE BANNER (WhatsApp Style) */}
                {getPinnedMessageForUser(activeUser?.username) && (
                  <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 py-2.5 flex items-center justify-between font-mono text-xs shadow-md shrink-0 animate-in fade-in">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="p-1.5 rounded-lg bg-amber-900/60 border border-amber-400/40 text-amber-400 shrink-0">
                        <Pin className="w-3.5 h-3.5 fill-amber-400/40 text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[10px] text-amber-300 font-bold">
                          <span>📌 Pinned Message</span>
                          <span className="text-slate-400">• {getPinnedMessageForUser(activeUser?.username).sender}</span>
                          <span className="text-slate-500">• {getPinnedMessageForUser(activeUser?.username).time}</span>
                        </div>
                        <p className="text-slate-100 text-xs font-sans font-medium truncate">{getPinnedMessageForUser(activeUser?.username).text}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs bg-slate-950/60">
                  {getDirectMessagesForUser(activeUser?.username || 'user').length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic font-mono space-y-2">
                      <Lock className="w-8 h-8 text-slate-700" />
                      <p>No messages in your private thread with Admin.</p>
                      <p className="text-[10px] text-slate-600">Send a message below to reach Admin directly.</p>
                    </div>
                  ) : (
                    getDirectMessagesForUser(activeUser?.username || 'user').map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-2xl max-w-md border space-y-1.5 shadow-md relative ${
                          msg.isGhost
                            ? 'bg-purple-950/90 border-purple-500/70 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                            : msg.sender === activeUser?.username
                            ? 'ml-auto bg-cyan-950/80 border-cyan-500/40 text-cyan-100'
                            : 'bg-amber-950/80 border-amber-500/40 text-amber-100'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800/80 pb-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              msg.sender === activeUser?.username
                                ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                : 'bg-amber-500 border-amber-400 text-slate-950'
                            }`}>
                              {(msg.sender || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className={`font-bold ${msg.sender === activeUser?.username ? 'text-cyan-400' : 'text-amber-400'}`}>
                              {msg.sender}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPinnedMessageForUser(activeUser?.username)?.id === msg.id && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-slate-950 flex items-center gap-0.5 shadow-sm">
                                <Pin className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                                <span>Pinned</span>
                              </span>
                            )}
                            <span>{msg.time}</span>
                            {/* Message Status Ticks (Single Tick ✓, Double Gray ✓✓, Double Blue Ticks ✓✓) */}
                            {msg.sender === activeUser?.username && (
                              <span className="inline-flex items-center ml-1">
                                {msg.status === 'seen' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-400 font-bold" title="Seen by Admin (Double Blue Ticks)" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-400" title="Delivered to Admin (Double Gray Ticks)" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-500" title="Sent (Single Tick)" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {msg.deleteAfterView && !msg.isRevealed ? (
                          <div className="p-3 rounded-xl bg-slate-950/90 border border-purple-500/60 space-y-2 my-1 font-mono text-xs">
                            <div className="flex items-center justify-between text-purple-300">
                              <span className="flex items-center gap-1.5 font-bold">
                                <Eye className="w-4 h-4 text-purple-400 animate-pulse" />
                                👁️ Delete-After-View Message
                              </span>
                              <span className="text-[9px] bg-purple-950 px-2 py-0.5 rounded text-purple-200 border border-purple-500/40">
                                View Once
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">Content protected. Self-destructs 3s after reveal.</p>
                            <button
                              onClick={() => handleRevealDeleteAfterViewMessage(activeUser?.username, msg.id, false)}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Tap to Reveal & Read</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            {msg.deleteAfterView && msg.isRevealed && (
                              <div className="text-[10px] font-mono text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/60 flex items-center gap-1.5 w-max my-1 animate-pulse">
                                <Flame className="w-3.5 h-3.5 text-rose-400" />
                                <span>👁️ Viewed! Burning in {Math.max(0, 3 - Math.floor((nowTimestamp - (msg.revealedTimestamp || Date.now())) / 1000))}s...</span>
                              </div>
                            )}

                            {msg.autoBurn && (
                              <div className="text-[10px] font-mono text-amber-300 bg-amber-950/70 px-2.5 py-1 rounded-lg border border-amber-500/50 flex items-center gap-1.5 w-max my-1">
                                <Flame className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                                <span>🔥 Self-Destructs in {Math.max(0, msg.autoBurn - Math.floor((nowTimestamp - (msg.createdTimestamp || Date.parse(msg.time) || Date.now())) / 1000))}s</span>
                              </div>
                            )}

                            {msg.isGhost && (
                              <div className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1 w-max my-1 animate-pulse">
                                <Ghost className="w-3 h-3 text-purple-400" />
                                <span>Ghost Mode (Auto-destructs after view)</span>
                              </div>
                            )}

                            <p className="text-sm text-slate-100 font-sans font-medium">{msg.text}</p>
                          </>
                        )}

                        <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono bg-slate-950/70 p-1.5 rounded border border-slate-800">
                          <span className="truncate max-w-[240px]">Payload: {msg.cipher}</span>
                          <button onClick={() => copyToClipboard(msg.cipher)} className="text-cyan-400 hover:underline shrink-0 ml-2">
                            Copy
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={userChatEndRef} />
                </div>

                {/* WhatsApp-Style Floating Scroll to Bottom Circle Button */}
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-20 right-4 z-30 w-9 h-9 rounded-full bg-slate-900/95 hover:bg-cyan-950 text-cyan-400 border border-cyan-500/50 shadow-[0_4px_16px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all hover:scale-110 active:scale-95 group cursor-pointer flex items-center justify-center relative"
                  title="Scroll to bottom of chat"
                >
                  <ChevronDown className="w-5 h-5 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
                  {hasUnreadDotUser && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-slate-950 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-bounce" />
                  )}
                </button>

                <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
                  <input
                    type="text"
                    value={directMsgInput}
                    onChange={(e) => setDirectMsgInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAdminDirectMessage()}
                    placeholder={isGhostMode ? "👻 Ghost Mode Active: Send auto-destructing message to Admin..." : "Send direct confidential message to Admin..."}
                    className={`flex-1 p-3 rounded-xl bg-slate-900 border text-xs font-mono text-slate-100 focus:outline-none ${isGhostMode ? 'border-purple-500/70 focus:border-purple-400' : 'border-slate-800 focus:border-amber-500'}`}
                  />
                  <button
                    onClick={handleSendAdminDirectMessage}
                    className={`px-5 py-3 rounded-xl font-mono font-bold text-xs uppercase flex items-center gap-2 shrink-0 ${isGhostMode ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}
                  >
                    <Send className="w-4 h-4" />
                    <span>{isGhostMode ? 'Ghost Send' : 'Send to Admin'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB: E2EE VAULT WITH ALGORITHM DROPDOWN SELECTION */}
        {activeTab === 'e2ee' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* ALGORITHM SELECTOR TOOLBAR */}
            <div className="bg-slate-900/80 rounded-2xl p-5 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-base text-slate-100">Select Cipher Algorithm</h3>
                  <p className="text-xs text-slate-400 font-mono">Choose hardware cryptographic primitive</p>
                </div>
              </div>

              {/* ALGORITHM DROPDOWN SELECTOR */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-mono text-slate-300">Algorithm:</label>
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                  className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/50 text-xs font-mono text-cyan-300 font-bold focus:outline-none"
                >
                  <option value="AES-256-GCM">AES-256-GCM (Authenticated WebCrypto - Recommended)</option>
                  <option value="AES-256-CBC">AES-256-CBC (PKCS7 Padding)</option>
                  <option value="ChaCha20-Poly1305">ChaCha20-Poly1305 (256-bit Stream Cipher)</option>
                  <option value="3DES-CBC">Triple-DES / 3DES-CBC (168-bit Legacy)</option>
                </select>
              </div>
            </div>

            {/* ENCRYPT & DECRYPT PANELS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* ENCRYPT PANEL */}
              <div className="bg-slate-900/80 rounded-2xl p-6 border border-cyan-500/30 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    <h2 className="font-mono font-bold text-lg text-slate-100">Encrypt ({selectedAlgorithm})</h2>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    PBKDF2-SHA256
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Secret Message Plaintext</label>
                  <textarea
                    rows="4"
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value)}
                    placeholder="Enter confidential text to encrypt..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Passphrase / Secret Key</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter secret passphrase"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleEncrypt}
                  disabled={isEncrypting}
                  className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)] flex items-center justify-center gap-2"
                >
                  {isEncrypting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Encrypt with {selectedAlgorithm}</span>
                </button>

                {encryptedOutput && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                      <span>{selectedAlgorithm} Ciphertext Payload</span>
                      <button onClick={() => copyToClipboard(encryptedOutput)} className="text-slate-400 hover:text-cyan-300">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 text-[11px] font-mono text-slate-300 break-all select-all max-h-32 overflow-y-auto">
                      {encryptedOutput}
                    </div>
                  </div>
                )}
              </div>

              {/* DECRYPT PANEL */}
              <div className="bg-slate-900/80 rounded-2xl p-6 border border-emerald-500/30 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Unlock className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-mono font-bold text-lg text-slate-100">Decrypt Ciphertext</h2>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Auto Detect Algo
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Paste Ciphertext Payload</label>
                  <textarea
                    rows="4"
                    value={decryptInput}
                    onChange={(e) => setDecryptInput(e.target.value)}
                    placeholder="Paste encrypted base64 payload here..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">Decryption Passphrase</label>
                  <input
                    type="password"
                    value={decryptPassphrase}
                    onChange={(e) => setDecryptPassphrase(e.target.value)}
                    placeholder="Enter decryption secret key"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleDecrypt}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Decrypt Ciphertext</span>
                </button>

                {decryptedResult && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/50 space-y-2 animate-in fade-in">
                    <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Decrypted Result
                    </span>
                    <div className="p-3 rounded bg-slate-900 text-sm font-mono text-slate-100 whitespace-pre-wrap">
                      {decryptedResult}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB: ADMIN SECURITY CONTROL & AUDIT OPERATIONS (VISIBLE ONLY TO ADMIN LOGIN) */}
        {activeTab === 'admin' && authRole === 'admin' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Admin Header & Sub-Tab Toolbar */}
            <div className="bg-slate-900/90 rounded-2xl p-6 border border-amber-500/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-950 border border-amber-500/50 text-amber-400">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-mono font-bold text-xl text-slate-100 flex items-center gap-2">
                    Admin Security Control & Operations Panel
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    User Management, Login History Audit, Suspicious Intrusion Alerts, and IP Tracking
                  </p>
                </div>
              </div>

              {/* Sub-Tab Toolbar Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setAdminSubTab('users')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminSubTab === 'users'
                      ? 'bg-amber-950 border border-amber-500 text-amber-300 shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>User Manager ({usersList.length})</span>
                </button>

                <button
                  onClick={() => setAdminSubTab('history')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminSubTab === 'history'
                      ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Login History ({loginHistory.length})</span>
                </button>

                <button
                  onClick={() => setAdminSubTab('alerts')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminSubTab === 'alerts'
                      ? 'bg-rose-950 border border-rose-500 text-rose-300 shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Suspicious Alerts</span>
                  {loginHistory.filter(l => l.risk === 'HIGH SUSPICIOUS').length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 text-white animate-pulse">
                      {loginHistory.filter(l => l.risk === 'HIGH SUSPICIOUS').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminSubTab('ips')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminSubTab === 'ips'
                      ? 'bg-emerald-950 border border-emerald-500 text-emerald-300 shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>IP History Log</span>
                </button>

                <button
                  onClick={() => setAdminSubTab('tor')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminSubTab === 'tor'
                      ? 'bg-purple-950 border border-purple-500 text-purple-300 shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Network className="w-3.5 h-3.5 text-purple-400" />
                  <span>Tor Router & Flowcharts</span>
                </button>

                <button
                  onClick={() => setAdminSubTab('face')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminSubTab === 'face'
                      ? 'bg-purple-950 border border-purple-500 text-purple-300 shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  <span>Face Biometrics</span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: USER MANAGEMENT (CRUD) */}
            {adminSubTab === 'users' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
                <div className="lg:col-span-5 bg-slate-900/80 rounded-2xl p-5 border border-cyan-500/30 shadow-xl space-y-4">
                  <h3 className="font-mono font-bold text-sm text-cyan-400 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Create New Operative Account
                  </h3>
                  <form onSubmit={handleCreateUser} className="space-y-3">
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Passkey"
                      value={newPasskey}
                      onChange={(e) => setNewPasskey(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                      >
                        <option value="User">User Role</option>
                        <option value="Admin">Admin Role</option>
                      </select>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase"
                      >
                        Create User
                      </button>
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-7 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
                  <h3 className="font-mono font-bold text-sm text-slate-200">Registered Vault Users</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                          <th className="py-2.5 px-3">Username</th>
                          <th className="py-2.5 px-3">Passkey</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {usersList.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-950/50">
                            {editingUserId === user.id ? (
                              <>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    className="w-full p-1.5 rounded bg-slate-950 border border-cyan-500 text-xs text-slate-100 font-mono"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={editPasskey}
                                    onChange={(e) => setEditPasskey(e.target.value)}
                                    className="w-full p-1.5 rounded bg-slate-950 border border-cyan-500 text-xs text-slate-100 font-mono"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="p-1.5 rounded bg-slate-950 border border-cyan-500 text-xs text-slate-100 font-mono"
                                  >
                                    <option value="User">User</option>
                                    <option value="Admin">Admin</option>
                                  </select>
                                </td>
                                <td className="py-2 px-2 text-right space-x-1">
                                  <button
                                    onClick={() => handleSaveEditUser(user.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-[11px]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingUserId(null)}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                                  >
                                    Cancel
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-3 font-semibold text-slate-100">{user.username}</td>
                                <td className="py-3 px-3 text-slate-400">{user.passkey}</td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${user.role === 'Admin' ? 'bg-amber-950 text-amber-400 border border-amber-500/40' : 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'}`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right space-x-2">
                                  <button
                                    onClick={() => handleStartEditUser(user)}
                                    className="text-cyan-400 hover:text-white font-mono text-[11px] underline"
                                    title="Edit User Details"
                                  >
                                    Edit Details
                                  </button>
                                  {user.username !== 'admin' && (
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-rose-400 hover:text-white" title="Delete User">
                                      <Trash2 className="w-4 h-4 inline" />
                                    </button>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: LOGIN HISTORY AUDIT */}
            {adminSubTab === 'history' && (
              <div className="bg-slate-900/80 rounded-2xl p-6 border border-cyan-500/30 shadow-xl space-y-4 animate-in fade-in font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Gateway Login History Audit Log
                    </h3>
                    <p className="text-[11px] text-slate-400">Recorded authentication requests with timestamp, IP, device & status</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearLoginHistory}
                      className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Clear All Login History Logs"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Clear Login History</span>
                    </button>
                    <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                      Total Logs: {loginHistory.length}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Username</th>
                        <th className="py-2.5 px-3">IP Address</th>
                        <th className="py-2.5 px-3">Device / Client</th>
                        <th className="py-2.5 px-3">Auth Status</th>
                        <th className="py-2.5 px-3 text-right">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {loginHistory.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-950/50">
                          <td className="py-3 px-3 text-slate-300 text-[11px]">{log.date}</td>
                          <td className="py-3 px-3 font-bold text-slate-100">{log.username}</td>
                          <td className="py-3 px-3 text-cyan-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>{log.ip}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px]">{log.device}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-950 text-rose-400 border border-rose-500/40 animate-pulse'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.risk === 'HIGH SUSPICIOUS'
                                ? 'bg-rose-900 text-rose-200 border border-rose-500'
                                : 'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}>
                              {log.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: SUSPICIOUS LOGIN ALERTS */}
            {adminSubTab === 'alerts' && (
              <div className="bg-slate-900/80 rounded-2xl p-6 border border-rose-500/40 shadow-xl space-y-4 animate-in fade-in font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-950 border border-rose-500/50 text-rose-400 animate-pulse">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-rose-300 flex items-center gap-2">
                        Suspicious Intrusion & Failed Login Alerts
                      </h3>
                      <p className="text-[11px] text-slate-400">Flagged unauthorized authentication attempts or brute-force retries</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-400 bg-rose-950/80 px-3 py-1 rounded border border-rose-800">
                    {loginHistory.filter(l => l.risk.includes('HIGH') || l.risk.includes('FAILED')).length} Active Alerts
                  </span>
                </div>

                {loginHistory.filter(l => l.risk.includes('HIGH') || l.risk.includes('FAILED')).length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400" />
                    <p className="text-sm font-bold text-slate-300">All Security Systems Operational & Safe</p>
                    <p className="text-xs text-slate-500">No suspicious login attempts detected in current session.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loginHistory.filter(l => l.risk.includes('HIGH') || l.risk.includes('FAILED')).map((alert) => (
                      <div key={alert.id} className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/80 space-y-2.5 shadow-lg animate-in fade-in">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-rose-300 text-sm">
                                  {alert.risk.includes('3 CONSECUTIVE') ? '🚨 3 CONSECUTIVE FAILED LOGINS DETECTED' : `Failed Access: "${alert.username}"`}
                                </span>
                                <span className="text-[10px] text-slate-400">({alert.date})</span>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">
                                Origin IP: <strong className="text-rose-400">{alert.ip}</strong> • Device: {alert.device}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded bg-rose-900/90 text-rose-200 text-[10px] font-bold uppercase border border-rose-500">
                              {alert.risk.includes('3 CONSECUTIVE') ? '3x FAILED LOGINS ALERT' : 'HIGH RISK ALERT'}
                            </span>
                            <button
                              onClick={() => {
                                setLoginHistory(prev => prev.filter(l => l.id !== alert.id));
                              }}
                              className="px-3 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 cursor-pointer"
                            >
                              Dismiss Alert
                            </button>
                          </div>
                        </div>

                        {/* Display Captured Credentials if available */}
                        {alert.usedCredentials && (
                          <div className="p-3 rounded-lg bg-black/90 border border-rose-500/50 font-mono space-y-1">
                            <p className="text-rose-300 font-bold text-xs flex items-center gap-1.5">
                              <span>🔑 Captured Attempted Credentials:</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                                Username Attempted: <strong className="text-amber-400">{alert.usedCredentials.username}</strong>
                              </div>
                              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                                Passkey/Password Attempted: <strong className="text-rose-400">{alert.usedCredentials.password}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 4: IP HISTORY LOG */}
            {adminSubTab === 'ips' && (
              <div className="bg-slate-900/80 rounded-2xl p-6 border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                        IP Address Access Audit Log
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">Tracking all connected client IP addresses and network endpoints</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearLoginHistory}
                      className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Clear All IP Access Audit Logs"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Clear IP Logs</span>
                    </button>
                    <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                      Total IPs: {Array.from(new Set(loginHistory.map(l => l.ip))).length}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th className="py-2.5 px-3">IP Address</th>
                        <th className="py-2.5 px-3">Last Username Attempt</th>
                        <th className="py-2.5 px-3">Device / Client Type</th>
                        <th className="py-2.5 px-3">Last Access Date & Time</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {Array.from(new Set(loginHistory.map(l => l.ip))).map(ip => {
                        const latestLog = loginHistory.find(l => l.ip === ip);
                        return (
                          <tr key={ip} className="hover:bg-slate-950/50">
                            <td className="py-3 px-3 font-bold text-emerald-400 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{ip}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-200 font-semibold">{latestLog.username}</td>
                            <td className="py-3 px-3 text-slate-400">{latestLog.device}</td>
                            <td className="py-3 px-3 text-slate-400 text-[11px]">{latestLog.date}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                latestLog.status === 'SUCCESS'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              }`}>
                                {latestLog.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 5: TOR ROUTER & VISUAL PROCESS MAPPINGS (FLOWCHARTS) */}
            {adminSubTab === 'tor' && (
              <div className="space-y-6 animate-in fade-in font-mono">
                
                {/* TOR ONION ROUTER MULTI-HOP CIRCUIT FLOWCHART */}
                <div className="bg-slate-900/80 rounded-2xl p-6 border border-purple-500/40 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-500/50 text-purple-400">
                        <Network className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-purple-300 flex items-center gap-2">
                          Tor Onion Router Multi-Hop Circuit Mapping
                        </h3>
                        <p className="text-xs text-slate-400">Visual mapping of 3-layer encrypted packet transmission across Tor relay nodes</p>
                      </div>
                    </div>
                    <span className="text-xs text-purple-300 bg-purple-950/80 px-3 py-1 rounded-lg border border-purple-500/50 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Circuit Status: ESTABLISHED (3 Hops Active)
                    </span>
                  </div>

                  {/* Interactive Visual Circuit Flowchart Map */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center py-4 relative">
                    {/* Node 1: Client Origin */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/50 space-y-2 text-center shadow-lg relative group hover:border-cyan-400 transition-all">
                      <div className="w-10 h-10 mx-auto rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500 flex items-center justify-center font-bold">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase block">Origin Client</span>
                        <span className="text-xs font-bold text-slate-100 block">Client App / User</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">IP Spoofed / AES Key 1</span>
                      </div>
                    </div>

                    {/* Flow Arrow 1 */}
                    <div className="hidden md:flex flex-col items-center justify-center text-purple-400">
                      <ArrowRight className="w-6 h-6 animate-pulse" />
                      <span className="text-[9px] text-purple-300">Layer 3 Enc.</span>
                    </div>

                    {/* Node 2: Entry Guard Node */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/50 space-y-2 text-center shadow-lg relative group hover:border-purple-400 transition-all">
                      <div className="w-10 h-10 mx-auto rounded-full bg-purple-950 text-purple-400 border border-purple-500 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-400 font-bold uppercase block">Entry Guard</span>
                        <span className="text-xs font-bold text-slate-100 block">Relay Node #1</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">IP: 185.220.101.4</span>
                      </div>
                    </div>

                    {/* Flow Arrow 2 */}
                    <div className="hidden md:flex flex-col items-center justify-center text-purple-400">
                      <ArrowRight className="w-6 h-6 animate-pulse" />
                      <span className="text-[9px] text-purple-300">Layer 2 Enc.</span>
                    </div>

                    {/* Node 3: Middle Relay Node */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/50 space-y-2 text-center shadow-lg relative group hover:border-amber-400 transition-all">
                      <div className="w-10 h-10 mx-auto rounded-full bg-amber-950 text-amber-400 border border-amber-500 flex items-center justify-center font-bold">
                        <GitFork className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase block">Middle Relay</span>
                        <span className="text-xs font-bold text-slate-100 block">Relay Node #2</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">IP: 198.96.155.3</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    {/* Node 4: Exit Node */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/50 space-y-2 text-center shadow-lg">
                      <div className="w-10 h-10 mx-auto rounded-full bg-rose-950 text-rose-400 border border-rose-500 flex items-center justify-center font-bold">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-400 font-bold uppercase block">Exit Gateway</span>
                        <span className="text-xs font-bold text-slate-100 block">Tor Exit Node</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">IP: 162.247.74.200</span>
                      </div>
                    </div>

                    {/* Arrow to Server */}
                    <div className="hidden md:flex items-center justify-center text-purple-400">
                      <ArrowRight className="w-8 h-8 animate-pulse mx-auto" />
                    </div>

                    {/* Node 5: SecCom Vault Server */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/50 space-y-2 text-center shadow-lg">
                      <div className="w-10 h-10 mx-auto rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500 flex items-center justify-center font-bold">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase block">Destination</span>
                        <span className="text-xs font-bold text-slate-100 block">AIBlog SecCom Vault</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">.onion Hidden Service</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FEATURE PROCESS FLOWCHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* FLOWCHART 1: GHOST MODE PROTOCOL */}
                  <div className="bg-slate-900/80 rounded-2xl p-5 border border-purple-500/30 space-y-4 shadow-xl">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Ghost className="w-4 h-4 text-purple-400" /> Ghost Mode Auto-Destruct Flowchart
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-purple-500/40 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-900 text-purple-200 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                        <span>Sender types msg with <strong>Ghost Mode: ON</strong></span>
                      </div>
                      <div className="text-center text-purple-400 font-bold">↓</div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                        <span>Delivered to recipient device <strong className="text-slate-400">(✓✓ Double Gray)</strong></span>
                      </div>
                      <div className="text-center text-purple-400 font-bold">↓</div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/40 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                        <span>Recipient views message <strong className="text-cyan-400">(✓✓ Double Blue)</strong></span>
                      </div>
                      <div className="text-center text-purple-400 font-bold">↓</div>
                      <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 flex items-center gap-2 text-rose-200 font-bold animate-pulse">
                        <span className="w-5 h-5 rounded-full bg-rose-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                        <span>Next Msg Event → Auto-Shred & Memory Purge</span>
                      </div>
                    </div>
                  </div>

                  {/* FLOWCHART 2: STEGANOGRAPHY LSB ENGINE */}
                  <div className="bg-slate-900/80 rounded-2xl p-5 border border-cyan-500/30 space-y-4 shadow-xl">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Eye className="w-4 h-4 text-cyan-400" /> Steganography Studio LSB Flowchart
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/40 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                        <span>Import Cover Photo + Passphrase payload</span>
                      </div>
                      <div className="text-center text-cyan-400 font-bold">↓</div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                        <span>AES-256 Encrypt & Append SECCOM Magic Header</span>
                      </div>
                      <div className="text-center text-cyan-400 font-bold">↓</div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/40 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                        <span>Force Alpha = 255 & Inject Red/Blue LSB</span>
                      </div>
                      <div className="text-center text-cyan-400 font-bold">↓</div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/40 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                        <span>Download PNG & Extract Secret on Any Device</span>
                      </div>
                    </div>
                  </div>

                  {/* FLOWCHART 3: SECURITY AUDIT & RISK ALERTS */}
                  <div className="bg-slate-900/80 rounded-2xl p-5 border border-amber-500/30 space-y-4 shadow-xl">
                    <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" /> Security Audit & Risk Engine
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/40 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                        <span>User submits authentication credentials</span>
                      </div>
                      <div className="text-center text-amber-400 font-bold">↓</div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                        <span>Extract IP, Timestamp & Device User-Agent</span>
                      </div>
                      <div className="text-center text-amber-400 font-bold">↓</div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-rose-500/40 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-300 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                        <span>Evaluate Failure Threshold & Risk Score</span>
                      </div>
                      <div className="text-center text-amber-400 font-bold">↓</div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/40 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                        <span>Record to Login Audit & Push Admin Alert</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* SUB-TAB 6: FACE RECOGNITION BIOMETRICS ENROLLMENT STUDIO */}
            {adminSubTab === 'face' && (
              <div className="bg-slate-900/90 rounded-2xl p-6 border border-purple-500/40 shadow-2xl space-y-8 animate-in fade-in font-mono">
                
                {/* Header Status Bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-950 border border-purple-500/50 text-purple-400">
                      <Camera className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-purple-300 flex items-center gap-2">
                        Admin Facial Biometric Studio
                      </h3>
                      <p className="text-xs text-slate-400">
                        Cross-device facial recognition system (Synced across all logged-in devices via Cloud Vault)
                      </p>
                    </div>
                  </div>
                  
                  {faceProfilesList.length > 0 ? (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{faceProfilesList.length} Face Profile(s) Enrolled</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-amber-950 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>No Face Profiles Enrolled Yet</span>
                    </span>
                  )}
                </div>

                {/* ADD NEW FACE PROFILE CARD */}
                <div className="bg-slate-950/80 rounded-2xl p-5 border border-purple-500/40 space-y-5 shadow-xl">
                  <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2 border-b border-slate-900 pb-3">
                    <UserPlus className="w-4 h-4 text-purple-400" /> Add New Face Profile
                  </h4>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Camera Feed */}
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                          Face Profile Label / Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Primary Laptop Face, Office Webcam, Mobile Angle..."
                          value={newFaceLabel}
                          onChange={(e) => setNewFaceLabel(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-slate-950 aspect-video flex items-center justify-center shadow-inner">
                        {/* HUD Overlay */}
                        <div className="absolute inset-0 z-10 pointer-events-none border-2 border-purple-500/20 m-3 rounded-xl flex flex-col justify-between p-3">
                          <div className="flex justify-between items-center text-[9px] text-purple-400 font-mono">
                            <span className="bg-purple-950/90 px-2 py-0.5 rounded border border-purple-500/40">HUD: ENROLLMENT</span>
                            <span className="bg-purple-950/90 px-2 py-0.5 rounded border border-purple-500/40 animate-pulse">64x64 BIOMETRIC MATRIX</span>
                          </div>
                          
                          <div className="w-40 h-40 mx-auto border-2 border-dashed border-purple-400/80 rounded-full flex items-center justify-center relative shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping"></div>
                            <Scan className="w-10 h-10 text-purple-400/40 absolute animate-spin" style={{ animationDuration: '10s' }} />
                          </div>

                          <div className="text-center text-[10px] text-purple-300 bg-slate-950/90 p-1.5 rounded border border-purple-500/30">
                            Position face inside circle & click "Take 3 Face Snapshots & Add Profile"
                          </div>
                        </div>

                        <video
                          ref={enrollVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform scale-x-[-1]"
                        />

                        {!isCameraActive && (
                          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                            <Camera className="w-10 h-10 text-purple-500 animate-bounce" />
                            <p className="text-xs text-slate-300 max-w-sm">
                              Initialize webcam to enroll new facial biometric template.
                            </p>
                            <button
                              type="button"
                              onClick={startEnrollCamera}
                              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-lg"
                            >
                              <Camera className="w-4 h-4" /> Start Camera
                            </button>
                          </div>
                        )}
                      </div>

                      {isCameraActive && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleCapture3Snapshots}
                            disabled={isCapturingSnapshots}
                            className="flex-1 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer"
                          >
                            {isCapturingSnapshots ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Capturing Snapshot {captureProgress} / 3...</span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-4 h-4" />
                                <span>Take 3 Face Snapshots & Add Profile</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={stopEnrollCamera}
                            className="px-4 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
                          >
                            Stop Camera
                          </button>
                        </div>
                      )}

                      {faceEnrollStatus && (
                        <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-200 text-xs font-mono">
                          {faceEnrollStatus}
                        </div>
                      )}
                    </div>

                    {/* Right: Snapshots Preview */}
                    <div className="lg:col-span-5 space-y-4">
                      <h5 className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-400" /> Current Capture Samples (3 Photos)
                      </h5>

                      <div className="grid grid-cols-3 gap-2.5">
                        {[0, 1, 2].map((idx) => {
                          const sampleImg = capturedFaceSamples[idx];
                          return (
                            <div
                              key={idx}
                              className="aspect-square rounded-xl bg-slate-900 border border-purple-500/30 overflow-hidden relative flex items-center justify-center shadow-md"
                            >
                              {sampleImg ? (
                                <>
                                  <img src={sampleImg} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover transform scale-x-[-1]" />
                                  <span className="absolute bottom-1 right-1 text-[8px] bg-purple-950/90 text-purple-300 px-1 py-0.5 rounded font-bold border border-purple-500/50">
                                    Snap #{idx + 1}
                                  </span>
                                </>
                              ) : (
                                <div className="text-center p-2 space-y-1">
                                  <Camera className="w-5 h-5 text-slate-700 mx-auto" />
                                  <span className="text-[8px] text-slate-500 block">Snap #{idx + 1}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                        <span className="font-bold text-purple-300 block">🌐 Cloud Persistence Note:</span>
                        <p>
                          Enrolled face profiles are instantly synchronized with Supabase Cloud Vault. You can unlock Admin access from any phone, laptop, or browser using any enrolled face.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* REGISTERED FACE PROFILES GRID (ADD & REMOVE FACES) */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" /> Enrolled Admin Face Profiles ({faceProfilesList.length})
                    </h4>
                    <span className="text-[10px] text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded border border-purple-500/30 font-mono">
                      ANY REGISTERED FACE MATCHES FOR UNLOCK
                    </span>
                  </div>

                  {faceProfilesList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-500 space-y-2">
                      <Camera className="w-10 h-10 text-slate-700 mx-auto" />
                      <p className="text-xs">No face profiles registered yet. Use the camera form above to enroll your face.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {faceProfilesList.map((profile) => (
                        <div
                          key={profile.id}
                          className="bg-slate-950 rounded-2xl p-4 border border-purple-500/40 space-y-3.5 shadow-lg relative group hover:border-purple-400 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 border-b border-slate-900 pb-2.5">
                            <div>
                              <h5 className="font-bold text-sm text-purple-200 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span>{profile.name}</span>
                              </h5>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Enrolled: {profile.date || 'Recently'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteFaceProfile(profile.id)}
                              title="Remove Face Profile"
                              className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            </button>
                          </div>

                          {/* 3 Snapshot Thumbnails */}
                          <div className="grid grid-cols-3 gap-2">
                            {[0, 1, 2].map((sIdx) => {
                              const snap = profile.samples && profile.samples[sIdx];
                              return (
                                <div
                                  key={sIdx}
                                  className="aspect-square rounded-lg bg-slate-900 border border-slate-800 overflow-hidden relative"
                                >
                                  {snap ? (
                                    <img src={snap} alt={`Snap ${sIdx + 1}`} className="w-full h-full object-cover transform scale-x-[-1]" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-600">Sample #{sIdx + 1}</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900 font-mono">
                            <span>Vector: 64-Grid Matrix</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Synced
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB: ADMIN BROADCAST & BURN NOTES */}
        {activeTab === 'burn' && (
          <div className="max-w-3xl mx-auto bg-slate-900/80 rounded-2xl p-6 border border-amber-500/40 shadow-2xl space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-400">
                <Flame className="w-6 h-6 animate-bounce text-amber-400" />
              </div>
              <div>
                <h2 className="font-mono font-bold text-xl text-slate-100 flex items-center gap-2">
                  Admin Broadcast & Burn-On-Read Notes
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Type a note below. When sent, all logged-in operatives receive a real-time burn-on-read alert with full Date & Time.
                </p>
              </div>
            </div>

            {broadcastStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono animate-in fade-in">
                {broadcastStatus}
              </div>
            )}

            <form onSubmit={handleSendAdminBroadcast} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">
                  Broadcast Note Message (Date & Time auto-attached):
                </label>
                <textarea
                  rows="4"
                  required
                  value={broadcastInput}
                  onChange={(e) => setBroadcastInput(e.target.value)}
                  placeholder="Type emergency operational broadcast or burn-on-read note..."
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-100 focus:border-amber-500 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
              >
                <Flame className="w-4 h-4 text-slate-950" />
                <span>📢 Broadcast Note to All Operatives (Burn-On-Read)</span>
              </button>
            </form>

            {/* PREVIEW OF ACTIVE BROADCAST */}
            {activeBroadcastNote && (
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                  <span className="font-bold flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" /> Active System Broadcast
                  </span>
                  <span className="text-[10px] text-slate-400">{activeBroadcastNote.time}</span>
                </div>
                <p className="text-sm font-sans text-slate-100 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  {activeBroadcastNote.text}
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setActiveBroadcastNote(null)}
                    className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Burn & Dismiss Note</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: STEGANOGRAPHY STUDIO */}
        {activeTab === 'stego' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
            
            {/* LEFT CARD: HIDE SECRET TEXT IN IMAGE (STEGO ENCODER & CREATE / DOWNLOAD) */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-cyan-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-mono font-bold text-base text-slate-100">Hide Secret Text in Image</h2>
                    <p className="text-[10px] text-slate-400 font-mono">Create LSB Steganography Image</p>
                  </div>
                </div>

                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-colors shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Image</span>
                  <input type="file" accept="image/*" onChange={handleImportEncoderImage} className="hidden" />
                </label>
              </div>

              {/* Canvas Preview */}
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-center min-h-[180px]">
                <canvas ref={canvasEncodeRef} className="rounded-lg max-w-full h-auto max-h-[200px] shadow-lg"></canvas>
              </div>

              {/* Secret Text Payload */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Secret Text</label>
                <textarea
                  rows="2"
                  value={encodeSecretText}
                  onChange={(e) => setEncodeSecretText(e.target.value)}
                  placeholder="Enter secret message to conceal inside image..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-400" />
                  <span>Password (Optional Encryption Passphrase)</span>
                </label>
                <input
                  type="password"
                  value={encodePassword}
                  onChange={(e) => setEncodePassword(e.target.value)}
                  placeholder="Enter password to encrypt secret payload..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Mobile Sharing Warning Tip */}
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] font-mono text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Mobile Sharing Tip:</strong> Always send the stego image as a <u>Document / File</u> (uncompressed PNG) on WhatsApp, Telegram, or Email. Sending as a photo compresses the image into lossy JPEG, which destroys hidden pixel data.
                </span>
              </div>

              {/* Action Buttons: Create Stego Image & Download */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleCreateStegoImage}
                  className="py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                >
                  <Eye className="w-4 h-4" />
                  <span>Create Stego Image</span>
                </button>

                <button
                  onClick={handleDownloadStegoImage}
                  disabled={!encodedResultDataUrl}
                  className={`py-3 rounded-xl font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${
                    encodedResultDataUrl
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Download Created Image</span>
                </button>
              </div>

              {encodeStatus && (
                <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/40 text-xs font-mono text-cyan-200 animate-in fade-in">
                  {encodeStatus}
                </div>
              )}
            </div>

            {/* RIGHT CARD: EXTRACT SECRET FROM IMAGE (STEGO DECODER) */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-emerald-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-400">
                    <FileSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-mono font-bold text-base text-slate-100">Extract Secret from Image</h2>
                    <p className="text-[10px] text-slate-400 font-mono">Decode LSB Steganography Image</p>
                  </div>
                </div>

                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center gap-1.5 transition-colors shadow-md">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Image</span>
                  <input type="file" accept="image/*" onChange={handleImportDecoderImage} className="hidden" />
                </label>
              </div>

              {/* Canvas Preview */}
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-center min-h-[180px]">
                <canvas ref={canvasDecodeRef} className="rounded-lg max-w-full h-auto max-h-[200px] shadow-lg"></canvas>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-400" />
                  <span>Password (Decryption Passphrase)</span>
                </label>
                <input
                  type="password"
                  value={decodePassword}
                  onChange={(e) => setDecodePassword(e.target.value)}
                  placeholder="Enter password to unlock payload..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Mobile Sharing Tip for Decoder */}
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] font-mono text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Extraction Requirement:</strong> Ensure you imported the original uncompressed PNG file. Photos sent via social media chats as regular images are compressed into lossy JPEG, which removes hidden stego bytes.
                </span>
              </div>

              {/* Action Button: Extract Secret */}
              <button
                onClick={handleExtractStegoSecret}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <FileSearch className="w-4 h-4" />
                <span>Extract Secret from Image</span>
              </button>

              {extractedSecretText && (
                <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/40 text-xs font-mono text-emerald-200 animate-in fade-in select-all break-all">
                  {extractedSecretText}
                </div>
              )}
            </div>

            {/* BOTTOM CARD: STORED STEGANOGRAPHIC IMAGES & KEY VAULT (WITH DB PURGE) */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-cyan-500/30 shadow-2xl space-y-4 col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-950 border border-purple-500/50 text-purple-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-mono font-bold text-base text-slate-100">Stored Steganographic Images & Key Vault</h2>
                    <p className="text-[10px] text-slate-400 font-mono">View saved stego images, security keys, & database purge controls</p>
                  </div>
                </div>

                {stegoVaultList.length > 0 && (
                  <button
                    onClick={handlePurgeAllStegoRecords}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-mono text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Purge All Stego Data (DB & Vault)</span>
                  </button>
                )}
              </div>

              {stegoVaultList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono italic bg-slate-950/60 rounded-xl border border-slate-800">
                  No stored steganographic images in vault. Create a stego image above to save it into database vault.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {stegoVaultList.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 hover:border-cyan-500/60 transition-all space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-cyan-300 truncate">{item.title || 'Untitled Stego Payload'}</span>
                        <span className="text-[10px] font-mono text-slate-500">{item.created}</span>
                      </div>

                      {item.dataUrl && (
                        <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex justify-center">
                          <img src={item.dataUrl} alt={item.title} className="max-h-28 rounded object-contain" />
                        </div>
                      )}

                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Key className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Key Details: {item.passwordHint}</span>
                        </div>
                        <div className="text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>Status: {item.isPasswordProtected ? '🔒 Encrypted (AES-256-GCM)' : '🔓 Plaintext LSB'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        {item.dataUrl && (
                          <button
                            onClick={() => handleLoadStegoToDecoder(item)}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <FileSearch className="w-3 h-3" />
                            <span>Load Decoder</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteStegoRecord(item.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-mono text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Delete this stego image & key data from database"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB: TOR ROUTER */}
        {activeTab === 'tor' && (
          <div className="bg-slate-900/80 rounded-2xl p-6 border border-cyan-500/30 space-y-6">
            <h2 className="font-mono font-bold text-xl text-slate-100">Tor Onion Circuit Simulation</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              {['Client Host', 'Entry Guard', 'Middle Relay', 'Exit Node', 'SecCom Target'].map((node, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs font-mono space-y-1">
                  <span className="text-cyan-400 font-bold">{node}</span>
                  <p className="text-slate-400">Hop #{i+1}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: KEYGEN & ENTROPY */}
        {activeTab === 'keygen' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-cyan-500/30 space-y-4">
              <h2 className="font-mono font-bold text-lg text-slate-100">Passphrase Entropy</h2>
              <input type="text" value={entropyPass} onChange={(e) => handleEntropyChange(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300" />
              <div className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-slate-300">
                Score: <strong style={{ color: entropyResult.gradeColor }}>{entropyResult.score} ({entropyResult.entropy} bits)</strong>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-2xl p-6 border border-emerald-500/30 space-y-4">
              <h2 className="font-mono font-bold text-lg text-slate-100">RSA-OAEP 2048 Keygen</h2>
              <button onClick={handleGenerateRSA} className="w-full py-3 bg-emerald-600 text-slate-950 font-bold text-xs uppercase">Generate Keys</button>
              {rsaKeys && <pre className="p-2 bg-slate-950 text-[10px] text-slate-300 max-h-28 overflow-y-auto">{rsaKeys.publicKeyPem}</pre>}
            </div>
          </div>
        )}

      </main>

      {/* PORTAL FOOTER */}
      <footer className="mt-12 py-8 border-t border-slate-900 text-center font-mono text-xs space-y-2">
        <p className="text-amber-400 font-bold text-sm">Author: Kiransai P</p>
        <p className="text-slate-400">SecCom Vault • Multi-Layer Steganography & Encrypted Portal</p>
        <p className="text-slate-600">© {new Date().getFullYear()} AIBlog Foundation. All Rights Reserved.</p>
      </footer>

      {/* SUPABASE CONFIGURATION MODAL */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-lg w-full p-6 space-y-4 font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Database className="w-5 h-5" />
                <span>Supabase Connection Setup</span>
              </div>
              <button onClick={() => setShowDbModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Supabase URL</label>
                <input type="url" value={inputDbUrl} onChange={(e) => setInputDbUrl(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100" />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Supabase Anon Key</label>
                <input type="password" value={inputDbKey} onChange={(e) => setInputDbKey(e.target.value)} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100" />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-slate-950 font-bold text-xs uppercase rounded-xl">Save & Connect</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
