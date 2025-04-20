import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Card, CardContent, CardActions,
  Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { motion } from 'framer-motion';
import { groupApi } from '../services/api';

interface Group {
  id: number;
  name: string;
  description: string;
  created_at: string;
  members: any[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover:   { scale: 1.03 },
};

const GroupList: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Dialog state
  const [openCreate, setOpenCreate]           = useState(false);
  const [newName, setNewName]                 = useState('');
  const [newDesc, setNewDesc]                 = useState('');
  const [inviteOpen, setInviteOpen]           = useState(false);
  const [inviteEmail, setInviteEmail]         = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen]         = useState(false);
  const [selectedGroup, setSelectedGroup]     = useState<Group | null>(null);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await groupApi.getGroups();
      setGroups(res.data);
    } catch {
      setError('Unable to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite    = async () => {
    if (!inviteEmail.trim() || selectedGroupId === null) return setError('Enter a valid email');
    try {
      await groupApi.addMember(selectedGroupId.toString(), inviteEmail);
      setInviteOpen(false); setInviteEmail('');
      fetchGroups();
    } catch {
      setError('Invite failed');
    }
  };

  const handleCreate    = async () => {
    if (!newName.trim()) return setError('Name cannot be empty');
    try {
      await groupApi.createGroup({ name: newName, description: newDesc });
      setOpenCreate(false); setNewName(''); setNewDesc('');
      fetchGroups();
    } catch {
      setError('Create failed');
    }
  };

  const handleRemove    = async (id: number) => { await groupApi.deleteGroup(id.toString()); fetchGroups(); };
  const handleLeave     = async (id: number) => { await groupApi.leaveGroup(id.toString()); fetchGroups(); };
  const openInviteDiag  = (id: number) => { setSelectedGroupId(id); setInviteOpen(true); };
  const openDetailsDiag = (g: Group)  => { setSelectedGroup(g); setDetailsOpen(true); };

  if (loading) return <Box textAlign="center"><CircularProgress /></Box>;
  if (error)   return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Typography variant="h4">My Groups</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
        >New Group</Button>
      </Box>

      {/* Empty State */}
      {groups.length === 0 ? (
        <Typography>You haven't created any groups yet.</Typography>
      ) : (
        <Grid container spacing={4}>
          {groups.map((g, i) => (
            <Grid key={g.id}>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h5">{g.name}</Typography>
                    <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                      {g.description || 'No description provided.'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(g.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      👥 {g.members.length} member{g.members.length !== 1 && 's'}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-start', px: 2, pb: 2 }}>
                    {/* 1. Invite */}
                    <Button size="small" variant="contained" onClick={() => openInviteDiag(g.id)}>
                      Invite
                    </Button>
                    {/* 2. View */}
                    <Button size="small" onClick={() => openDetailsDiag(g)}>
                      View Details
                    </Button>
                    {/* 3. Leave */}
                    <Button size="small" color="secondary" onClick={() => handleLeave(g.id)}>
                      Leave
                    </Button>
                    {/* 4. Remove */}
                    <Button size="small" color="error" onClick={() => handleRemove(g.id)}>
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ——— Create Group ——— */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus margin="dense" label="Group Name" fullWidth
            value={newName} onChange={e => setNewName(e.target.value)}
          />
          <TextField
            margin="dense" label="Description" fullWidth multiline rows={3}
            value={newDesc} onChange={e => setNewDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* ——— Invite Member ——— */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus margin="dense" label="Email" type="email" fullWidth
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInvite}>Invite</Button>
        </DialogActions>
      </Dialog>

      {/* ——— Group Details ——— */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)}>
        <DialogTitle>Group Details</DialogTitle>
        <DialogContent>
          {selectedGroup && (
            <Box>
              <Typography variant="h5">{selectedGroup.name}</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {selectedGroup.description || 'No description.'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Created on {new Date(selectedGroup.created_at).toLocaleString()}
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                👥 Members ({selectedGroup.members.length})
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupList;
