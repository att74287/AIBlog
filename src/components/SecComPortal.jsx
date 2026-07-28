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
  Workflow,
  GitFork,
  ArrowRight,
  Share2,
  Layers
} from 'lucide-react';

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
  const [usersList, setUsersList] = useState([
    { id: 'usr-1', username: 'admin', passkey: 'admin', role: 'Admin', status: 'Active', created: '2026-07-26' },
    { id: 'usr-2', username: 'user', passkey: 'user', role: 'User', status: 'Active', created: '2026-07-26' }
  ]);
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

  // GHOST MODE & ADMIN SECURITY AUDIT STATE
  const [adminSubTab, setAdminSubTab] = useState('users'); // 'users' | 'history' | 'alerts' | 'ips'
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [loginHistory, setLoginHistory] = useState([
    { id: 'log-101', username: 'admin', ip: '192.168.1.101', status: 'SUCCESS', date: formatTimestamp('2026-07-28T20:00:00'), device: 'Chrome 124 / Windows 11', risk: 'LOW' },
    { id: 'log-102', username: 'user', ip: '192.168.1.105', status: 'SUCCESS', date: formatTimestamp('2026-07-28T20:15:00'), device: 'Mobile Safari / iOS 17', risk: 'LOW' },
    { id: 'log-103', username: 'root_hacker', ip: '185.220.101.5', status: 'FAILED', date: formatTimestamp('2026-07-28T20:45:00'), device: 'Tor Exit Node / Script Bot', risk: 'HIGH SUSPICIOUS' },
    { id: 'log-104', username: 'admin_attack', ip: '45.33.32.156', status: 'FAILED', date: formatTimestamp('2026-07-28T21:05:00'), device: 'BruteForce Python Script', risk: 'HIGH SUSPICIOUS' }
  ]);

  // REALTIME ADMIN-USER DIRECT CHAT STATE
  const [selectedChatUser, setSelectedChatUser] = useState('user');
  const [adminChatPerspective, setAdminChatPerspective] = useState('Admin');
  const [adminDirectMessages, setAdminDirectMessages] = useState({
    'user': [
      { id: 'dir-1', sender: 'Admin', cipher: 'adm-01.aes', text: 'SecCom Command established. State your clearance code.', time: formatTimestamp('2026-07-28T20:30:00'), status: 'seen', isGhost: false },
      { id: 'dir-2', sender: 'user', cipher: 'usr-01.aes', text: 'Clearance verified: User-7-Delta. Ready for task.', time: formatTimestamp('2026-07-28T20:31:00'), status: 'seen', isGhost: false }
    ]
  });
  const [directMsgInput, setDirectMsgInput] = useState('');

  // REALTIME ADMIN BROADCAST & BURN NOTE STATE
  const [activeBroadcastNote, setActiveBroadcastNote] = useState(null);
  const [broadcastInput, setBroadcastInput] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');

  // DUAL REALTIME BROADCAST CHANNELS & LOCALSTORAGE EVENT SYNC
  const broadcastChannelRef = useRef(null);

  // SUPABASE DATABASE INITIALIZATION & REALTIME LISTENERS
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch Users
      const fetchSupabaseUsers = async () => {
        const { data, error } = await supabase.from('vault_users').select('*');
        if (!error && data && data.length > 0) {
          setUsersList(data.map(u => ({
            id: u.id,
            username: u.username,
            passkey: u.passkey,
            role: u.role || 'User',
            status: u.status || 'Active',
            created: u.created_at ? u.created_at.split('T')[0] : '2026-07-26'
          })));
        }
      };

      // 2. Fetch Room Messages
      const fetchRoomMessages = async () => {
        const { data, error } = await supabase.from('room_messages').select('*').order('created_at', { ascending: true });
        if (!error && data) {
          const grouped = {};
          data.forEach(m => {
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
          setRoomMessages(prev => ({ ...prev, ...grouped }));
        }
      };

      // 3. Fetch Direct Messages
      const fetchDirectMessages = async () => {
        const { data, error } = await supabase.from('direct_messages').select('*').order('created_at', { ascending: true });
        if (!error && data) {
          const grouped = {};
          data.forEach(m => {
            if (!grouped[m.target_user]) grouped[m.target_user] = [];
            grouped[m.target_user].push({
              id: m.id,
              sender: m.sender,
              cipher: m.cipher,
              text: m.text,
              time: m.created_at ? formatTimestamp(m.created_at) : formatTimestamp()
            });
          });
          setAdminDirectMessages(prev => ({ ...prev, ...grouped }));
        }
      };

      fetchSupabaseUsers();
      fetchRoomMessages();
      fetchDirectMessages();

      // 4. Subscribe to Supabase Realtime Channels
      const channel = supabase.channel('seccom_realtime_db')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages' }, (payload) => {
          const m = payload.new;
          const msgObj = {
            id: m.id,
            sender: m.sender,
            cipher: m.cipher,
            text: m.text,
            time: formatTimestamp(m.created_at),
            autoBurn: m.auto_burn
          };
          setRoomMessages(prev => ({
            ...prev,
            [m.room]: [...(prev[m.room] || []).filter(existing => existing.id !== m.id), msgObj]
          }));
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
            time: formatTimestamp(m.created_at)
          };
          setAdminDirectMessages(prev => ({
            ...prev,
            [m.target_user]: [...(prev[m.target_user] || []).filter(existing => existing.id !== m.id), msgObj]
          }));
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
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Synchronize state incoming from other tabs/clients instantly
  const handleIncomingMessagePayload = (data) => {
    if (data.type === 'ROOM_MESSAGE') {
      setRoomMessages((prev) => {
        const roomMsgs = prev[data.room] || [];
        if (roomMsgs.some((m) => m.id === data.message.id)) return prev;
        return {
          ...prev,
          [data.room]: [...roomMsgs, data.message]
        };
      });
    } else if (data.type === 'DIRECT_MESSAGE') {
      setAdminDirectMessages((prev) => {
        const userMsgs = prev[data.targetUser] || [];
        if (userMsgs.some((m) => m.id === data.message.id)) return prev;
        return {
          ...prev,
          [data.targetUser]: [...userMsgs, data.message]
        };
      });
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
    } else if (data.type === 'DIRECT_MESSAGE') {
      setAdminDirectMessages((prev) => {
        const list = prev[data.targetUser] || [];
        if (list.some((m) => m.id === data.message.id)) return prev;

        let remaining = list;
        if (data.isGhostMode || isGhostMode) {
          remaining = list.filter((m) => m.status !== 'seen');
        }
        return {
          ...prev,
          [data.targetUser]: [...remaining, data.message]
        };
      });
      if (activeTab === 'chat') {
        const currentTarget = authRole === 'admin' ? selectedChatUser : activeUser?.username;
        if (currentTarget === data.targetUser) {
          setTimeout(() => markDirectMessagesAsSeen(data.targetUser), 300);
        }
      }
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
      setRoomMessages((prev) => {
        const genMsgs = prev['#general-vault'] || [];
        if (genMsgs.some((m) => m.id === data.broadcast.id)) return prev;
        return {
          ...prev,
          '#general-vault': [
            ...genMsgs,
            {
              id: data.broadcast.id,
              sender: '📢 ADMIN BROADCAST',
              cipher: 'SECCOM-BROADCAST.ALL',
              text: data.broadcast.text,
              time: data.broadcast.time
            }
          ]
        };
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
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(payload);
    }
    try {
      localStorage.setItem('seccom_sync_event', JSON.stringify({ ...payload, _nonce: Date.now() }));
    } catch {}
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
  const recordLoginAttempt = (username, status, riskLevel = 'LOW') => {
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
      risk: riskLevel
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

  // HANDLE GATEWAY LOGIN VERIFICATION (SMART AUTO-ROLE LOGIN)
  const handleGatewayLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    // Check if Admin Credentials
    if (cleanUser === 'admin' && cleanPass === 'admin') {
      recordLoginAttempt('admin', 'SUCCESS', 'LOW');
      setAuthRole('admin');
      setActiveUser({ username: 'admin', role: 'Admin' });
      setRoomSenderName('Admin-Command');
      setActiveTab('admin'); // Automatically open Admin Portal
      return;
    }

    // Check against usersList or default user credentials
    const foundUser = usersList.find(
      (u) => u.username.toLowerCase() === cleanUser && u.passkey === cleanPass
    );

    if (foundUser || (cleanUser === 'user' && cleanPass === 'user')) {
      const loggedUser = foundUser || { username: 'user', role: 'User' };
      recordLoginAttempt(loggedUser.username, 'SUCCESS', 'LOW');
      if (loggedUser.role === 'Admin' || loggedUser.username.toLowerCase() === 'admin') {
        setAuthRole('admin');
        setActiveUser({ username: loggedUser.username, role: 'Admin' });
        setRoomSenderName('Admin-Command');
        setActiveTab('admin');
      } else {
        setAuthRole('user');
        setActiveUser(loggedUser);
        setRoomSenderName(loggedUser.username);
        setSelectedChatUser(loggedUser.username);
        setActiveTab('chat');
      }
    } else {
      recordLoginAttempt(loginUsername || 'Unknown', 'FAILED', 'HIGH SUSPICIOUS');
      setLoginError('Invalid Username or Passkey credentials!');
    }
  };

  // ADMIN USER CRUD OPERATIONS
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPasskey) return;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('vault_users').insert({
        username: newUsername,
        passkey: newPasskey,
        role: newRole,
        status: 'Active'
      }).select().single();

      if (!error && data) {
        setUsersList(prev => [...prev, {
          id: data.id,
          username: data.username,
          passkey: data.passkey,
          role: data.role,
          status: data.status,
          created: data.created_at.split('T')[0]
        }]);
      }
    } else {
      const newUser = {
        id: 'usr-' + Date.now(),
        username: newUsername,
        passkey: newPasskey,
        role: newRole,
        status: 'Active',
        created: new Date().toISOString().split('T')[0]
      };
      setUsersList(prev => [...prev, newUser]);
    }

    setNewUsername('');
    setNewPasskey('');
  };

  const handleDeleteUser = async (userId) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('vault_users').delete().eq('id', userId);
    }
    setUsersList(prev => prev.filter(u => u.id !== userId));
  };

  const handleStartEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditPasskey(user.passkey);
    setEditRole(user.role || 'User');
  };

  const handleSaveEditUser = async (userId) => {
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('vault_users')
        .update({ username: editUsername, passkey: editPasskey, role: editRole })
        .eq('id', userId);
    }
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, username: editUsername, passkey: editPasskey, role: editRole }
          : u
      )
    );
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
      autoBurn: autoBurnSeconds !== 'none' ? parseInt(autoBurnSeconds, 10) : null
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('room_messages').insert({
        room: selectedRoom,
        sender: msg.sender,
        cipher: msg.cipher,
        text: msg.text,
        auto_burn: msg.autoBurn
      });
    } else {
      setRoomMessages((prev) => ({
        ...prev,
        [selectedRoom]: [...(prev[selectedRoom] || []), msg]
      }));

      emitRealtimeSync({
        type: 'ROOM_MESSAGE',
        room: selectedRoom,
        message: msg
      });
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
    if (isSupabaseConfigured && supabase) {
      await supabase.from('room_messages').delete().eq('id', messageId);
    } else {
      setRoomMessages((prev) => ({
        ...prev,
        [room]: (prev[room] || []).filter((m) => m.id !== messageId)
      }));

      emitRealtimeSync({
        type: 'DESTROY_ROOM_MESSAGE',
        room: room,
        messageId: messageId
      });
    }
  };

  // PURGE ALL MESSAGES IN CURRENT ROOM
  const handlePurgeAllRoomMessages = async (room) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('room_messages').delete().eq('room', room);
    } else {
      setRoomMessages((prev) => ({
        ...prev,
        [room]: []
      }));

      emitRealtimeSync({
        type: 'PURGE_ROOM_MESSAGES',
        room: room
      });
    }
  };

  // ADMIN-USER REALTIME DIRECT CHAT TRANSMISSION
  const handleSendAdminDirectMessage = async () => {
    if (!directMsgInput.trim()) return;
    const currentInput = directMsgInput;
    const target = authRole === 'admin' ? selectedChatUser : activeUser?.username || 'operative-alpha';
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
      status: 'delivered',
      isGhost: isGhostMode
    };

    setAdminDirectMessages((prev) => {
      const list = prev[target] || [];
      let remaining = list;
      if (isGhostMode) {
        remaining = list.filter((m) => m.status !== 'seen');
      }
      return {
        ...prev,
        [target]: [...remaining, msg]
      };
    });

    emitRealtimeSync({
      type: 'DIRECT_MESSAGE',
      targetUser: target,
      message: msg,
      isGhostMode: isGhostMode
    });

    if (isSupabaseConfigured && supabase) {
      await supabase.from('direct_messages').insert({
        target_user: target,
        sender: msg.sender,
        cipher: msg.cipher,
        text: msg.text
      });
    }
  };

  // MARK DIRECT MESSAGES AS SEEN (DOUBLE CYAN TICKS & GHOST MODE PURGE)
  const markDirectMessagesAsSeen = (targetUser) => {
    if (!targetUser) return;
    setAdminDirectMessages((prev) => {
      const list = prev[targetUser] || [];
      let updatedAny = false;
      const currentUser = authRole === 'admin' ? 'Admin' : activeUser?.username;

      const updated = list.map((m) => {
        if (m.sender !== currentUser && m.status !== 'seen') {
          updatedAny = true;
          return { ...m, status: 'seen' };
        }
        return m;
      });

      let finalMessages = updated;
      if (isGhostMode) {
        const hasUnseen = updated.some(m => m.status !== 'seen');
        if (hasUnseen) {
          finalMessages = updated.filter(m => m.status !== 'seen');
        } else if (updated.length > 1) {
          finalMessages = [updated[updated.length - 1]];
        }
      }

      if (updatedAny) {
        emitRealtimeSync({ type: 'MARK_MESSAGES_SEEN', targetUser: targetUser, isGhostMode });
      }

      return { ...prev, [targetUser]: finalMessages };
    });
  };

  // Auto-mark direct messages as SEEN when chat tab is active
  useEffect(() => {
    if (activeTab === 'chat') {
      const targetUser = authRole === 'admin' ? selectedChatUser : activeUser?.username || 'user';
      if (targetUser) {
        markDirectMessagesAsSeen(targetUser);
      }
    }
  }, [activeTab, selectedChatUser, activeUser]);

  // ADMIN BROADCAST & BURN NOTE TRANSMISSION
  const handleSendAdminBroadcast = async (e) => {
    if (e) e.preventDefault();
    if (!broadcastInput.trim()) return;

    const noteId = 'bcast-' + Date.now();
    const formattedTime = formatTimestamp();
    const broadcastObj = {
      id: noteId,
      sender: 'Admin-Command',
      text: broadcastInput.trim(),
      time: formattedTime
    };

    setActiveBroadcastNote(broadcastObj);

    // Also post to #general-vault room chat automatically
    const broadcastMsg = {
      id: noteId,
      sender: '📢 ADMIN BROADCAST',
      cipher: 'SECCOM-BROADCAST.ALL',
      text: broadcastInput.trim(),
      time: formattedTime
    };

    setRoomMessages((prev) => ({
      ...prev,
      '#general-vault': [...(prev['#general-vault'] || []), broadcastMsg]
    }));

    if (isSupabaseConfigured && supabase) {
      await supabase.from('room_messages').insert({
        room: '#general-vault',
        sender: '📢 ADMIN BROADCAST',
        cipher: 'SECCOM-BROADCAST.ALL',
        text: broadcastInput.trim(),
        auto_burn: null
      });
    }

    emitRealtimeSync({
      type: 'ADMIN_BROADCAST',
      broadcast: broadcastObj
    });

    setBroadcastInput('');
    setBroadcastStatus('✅ Broadcast Note sent to all connected operatives in real-time!');
    setTimeout(() => setBroadcastStatus(''), 5000);
  };

  // DESTROY INDIVIDUAL DIRECT MESSAGE
  const handleDestroyDirectMessage = async (targetUser, messageId) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('direct_messages').delete().eq('id', messageId);
    } else {
      setAdminDirectMessages((prev) => ({
        ...prev,
        [targetUser]: (prev[targetUser] || []).filter((m) => m.id !== messageId)
      }));

      emitRealtimeSync({
        type: 'DESTROY_DIRECT_MESSAGE',
        targetUser: targetUser,
        messageId: messageId
      });
    }
  };

  // PURGE ALL DIRECT MESSAGES FOR TARGET USER
  const handlePurgeAllDirectMessages = async (targetUser) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('direct_messages').delete().eq('target_user', targetUser);
    } else {
      setAdminDirectMessages((prev) => ({
        ...prev,
        [targetUser]: []
      }));

      emitRealtimeSync({
        type: 'PURGE_DIRECT_MESSAGES',
        targetUser: targetUser
      });
    }
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
      setEncodeStatus(
        encodePassword.trim()
          ? '🔒 Encrypted with password & embedded in image pixels successfully! Click Download below.'
          : '✅ Secret payload embedded in image pixels successfully! Click Download below.'
      );
    } catch (err) {
      alert(err.message);
    }
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
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.2)] shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
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

            {/* Supabase Connection Status Button */}
            <button
              onClick={() => setShowDbModal(true)}
              className={`flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-mono transition-all ${
                isSupabaseConfigured
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900'
                  : 'bg-slate-950 border-amber-500/40 text-amber-300 hover:bg-slate-900'
              }`}
              title="Click to Configure Supabase Credentials"
            >
              <Database className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
              <span className="hidden sm:inline">{isSupabaseConfigured ? 'Supabase DB Connected' : 'Connect DB'}</span>
              <span className="inline sm:hidden">{isSupabaseConfigured ? 'DB Connected' : 'DB Setup'}</span>
            </button>

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
                <div className="flex items-center gap-3">
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

                  <button
                    onClick={() => handlePurgeAllRoomMessages(selectedRoom)}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-mono flex items-center gap-1.5 transition-colors"
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
                      const msgCount = (adminDirectMessages[u.username] || []).length;
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
                            <div className={`p-2 rounded-lg border ${isSelected ? 'bg-amber-900 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-xs">{u.username}</p>
                              <p className="text-[9px] text-slate-500">Role: {u.role}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {msgCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
                                {msgCount}
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
                <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[600px] overflow-hidden">
                  
                  {/* Chat Header */}
                  <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-950 border border-amber-500/50 text-amber-400">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-mono font-bold text-sm text-slate-100 flex items-center gap-2">
                          Private Line: <span className="text-amber-400">Admin ↔ {selectedChatUser}</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">Strict 1-on-1 isolated encrypted channel</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
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
                        className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-mono flex items-center gap-1"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Clear Chat with {selectedChatUser}</span>
                      </button>
                    </div>
                  </div>

                  {/* Message History */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs bg-slate-950/60">
                    {(adminDirectMessages[selectedChatUser] || []).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic font-mono space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-700" />
                        <p>No messages in private thread with <strong className="text-amber-400">{selectedChatUser}</strong>.</p>
                        <p className="text-[10px] text-slate-600">Type below to start isolated conversation.</p>
                      </div>
                    ) : (
                      (adminDirectMessages[selectedChatUser] || []).map((msg) => (
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
                            <span className={`font-bold ${msg.sender === 'Admin' ? 'text-amber-400' : 'text-cyan-400'}`}>
                              {msg.sender}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <span>{msg.time}</span>

                              {/* Message Status Ticks (Single Tick ✓, Double Gray ✓✓, Double Blue/Cyan ✓✓) */}
                              {msg.sender === 'Admin' && (
                                <span className="inline-flex items-center ml-1">
                                  {msg.status === 'seen' ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-cyan-400" title="Seen by Recipient (Double Blue Ticks)" />
                                  ) : msg.status === 'delivered' ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-slate-400" title="Delivered to Recipient (Double Gray Ticks)" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-slate-500" title="Sent (Single Tick)" />
                                  )}
                                </span>
                              )}

                              <button
                                onClick={() => handleDestroyDirectMessage(selectedChatUser, msg.id)}
                                className="p-1 rounded bg-rose-950 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors border border-rose-500/40"
                              >
                                <Flame className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {msg.isGhost && (
                            <div className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1 w-max my-1 animate-pulse">
                              <Ghost className="w-3 h-3 text-purple-400" />
                              <span>Ghost Mode (Auto-destructs after view)</span>
                            </div>
                          )}

                          <p className="text-sm text-slate-100 font-sans font-medium">{msg.text}</p>

                          <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono bg-slate-950/70 p-1.5 rounded border border-slate-800">
                            <span className="truncate max-w-[240px]">Payload: {msg.cipher}</span>
                            <button onClick={() => copyToClipboard(msg.cipher)} className="text-amber-400 hover:underline shrink-0 ml-2">
                              Copy
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

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
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl flex flex-col h-[600px] overflow-hidden">
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-950 border border-amber-500/50 text-amber-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-sm text-slate-100">
                        Private Line: <span className="text-amber-400">{activeUser?.username} ↔ Admin</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">End-to-End Encrypted 1-on-1 direct channel with Admin</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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

                <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs bg-slate-950/60">
                  {(adminDirectMessages[activeUser?.username] || []).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic font-mono space-y-2">
                      <Lock className="w-8 h-8 text-slate-700" />
                      <p>No messages in your private thread with Admin.</p>
                      <p className="text-[10px] text-slate-600">Send a message below to reach Admin directly.</p>
                    </div>
                  ) : (
                    (adminDirectMessages[activeUser?.username] || []).map((msg) => (
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
                          <span className={`font-bold ${msg.sender === activeUser?.username ? 'text-cyan-400' : 'text-amber-400'}`}>
                            {msg.sender}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{msg.time}</span>
                            {/* Message Status Ticks (Single Tick ✓, Double Gray ✓✓, Double Blue/Cyan ✓✓) */}
                            {msg.sender === activeUser?.username && (
                              <span className="inline-flex items-center ml-1">
                                {msg.status === 'seen' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-cyan-400" title="Seen by Admin (Double Blue Ticks)" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-400" title="Delivered to Admin (Double Gray Ticks)" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-500" title="Sent (Single Tick)" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {msg.isGhost && (
                          <div className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1 w-max my-1 animate-pulse">
                            <Ghost className="w-3 h-3 text-purple-400" />
                            <span>Ghost Mode (Auto-destructs after view)</span>
                          </div>
                        )}

                        <p className="text-sm text-slate-100 font-sans font-medium">{msg.text}</p>

                        <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono bg-slate-950/70 p-1.5 rounded border border-slate-800">
                          <span className="truncate max-w-[240px]">Payload: {msg.cipher}</span>
                          <button onClick={() => copyToClipboard(msg.cipher)} className="text-cyan-400 hover:underline shrink-0 ml-2">
                            Copy
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

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
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Gateway Login History Audit Log
                    </h3>
                    <p className="text-[11px] text-slate-400">Recorded authentication requests with timestamp, IP, device & status</p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded border border-slate-800">
                    Total Logs: {loginHistory.length}
                  </span>
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
                    {loginHistory.filter(l => l.risk === 'HIGH SUSPICIOUS').length} Active Alerts
                  </span>
                </div>

                {loginHistory.filter(l => l.risk === 'HIGH SUSPICIOUS').length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400" />
                    <p className="text-sm font-bold text-slate-300">All Security Systems Operational & Safe</p>
                    <p className="text-xs text-slate-500">No suspicious login attempts detected in current session.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loginHistory.filter(l => l.risk === 'HIGH SUSPICIOUS').map((alert) => (
                      <div key={alert.id} className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-rose-300 text-sm">Failed Access: "{alert.username}"</span>
                              <span className="text-[10px] text-slate-400">({alert.date})</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">
                              Origin IP: <strong className="text-rose-400">{alert.ip}</strong> • Device: {alert.device}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded bg-rose-900/90 text-rose-200 text-[10px] font-bold uppercase border border-rose-500">
                            HIGH RISK ALERT
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
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 4: IP HISTORY LOG */}
            {adminSubTab === 'ips' && (
              <div className="bg-slate-900/80 rounded-2xl p-6 border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
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
