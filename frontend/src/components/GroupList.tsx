import React, { useState, useEffect } from 'react';
import { 
  Typography, Button, Card, CardContent, CardActions, 
  Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { groupApi } from '../services/api';

interface Group {
  id: number;
  name: string;
  description: string;
  created_at: string;
  members: any[];
}

const GroupList: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for creating new groups
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // State for inviting a member to a group
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // State for viewing details
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupApi.getGroups();
      setGroups(response.data);
    } catch (error: any) {
      console.error('Failed to fetch groups:', error);
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      await groupApi.leaveGroup(groupId.toString());
      fetchGroups(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      setError('Failed to leave group');
    }
  };

  // New Group Modal Handlers
  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setNewGroupName('');
    setNewGroupDescription('');
  };

  const handleCreateGroup = async () => {
    try {
      await groupApi.createGroup({
        name: newGroupName,
        description: newGroupDescription
      });
      handleCloseCreateDialog();
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to create group:', error);
      setError('Failed to create group');
    }
  };

  // Remove Group Handler
  const handleRemoveGroup = async (groupId: number) => {
    try {
      await groupApi.deleteGroup(groupId.toString());
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to remove group:', error);
      setError('Failed to remove group');
    }
  };

  // Invite Member Modal Handlers (Invite by email)
  const handleOpenInviteDialog = (groupId: number) => {
    setSelectedGroupId(groupId);
    setInviteDialogOpen(true);
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteEmail('');
    setSelectedGroupId(null);
  };

  const handleInviteMember = async () => {
    if (selectedGroupId === null) return;
    if (!inviteEmail.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      console.log(`Inviting ${inviteEmail} to group ${selectedGroupId}`);
      await groupApi.addMember(selectedGroupId.toString(), inviteEmail);
      handleCloseInviteDialog();
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      } else {
        console.error("Error message:", error.message);
      }
      setError('Failed to invite member');
    }
  };

  // View Details Handlers
  const handleOpenDetailsDialog = (group: Group) => {
    setSelectedGroup(group);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedGroup(null);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">My Groups</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          New Group
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Typography>You haven't created any groups yet.</Typography>
      ) : (
        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid key={group.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {group.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {group.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Members: {group.members.length}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleOpenDetailsDialog(group)}>
                    View Details
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => handleRemoveGroup(group.id)}
                  >
                    Remove
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => handleOpenInviteDialog(group.id)}
                  >
                    Invite
                  </Button>
                  <Button 
                  size="small"
                  color="secondary"
                  onClick={() => handleLeaveGroup(group.id)}>
                  Leave Group
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Group Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog}>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Group Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button onClick={handleCreateGroup} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog}>
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="inviteEmail"
            label="Member Email"
            type="email"
            fullWidth
            variant="outlined"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInviteDialog}>Cancel</Button>
          <Button onClick={handleInviteMember} variant="contained">Invite</Button>
        </DialogActions>
      </Dialog>

      {/* Group Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetailsDialog}>
        <DialogTitle>Group Details</DialogTitle>
        <DialogContent>
          {selectedGroup && (
            <Box>
              <Typography variant="h5" component="div">
                {selectedGroup.name}
              </Typography>
              <Typography variant="body1">
                {selectedGroup.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created At: {selectedGroup.created_at}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Members: {selectedGroup.members.length}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default GroupList;
