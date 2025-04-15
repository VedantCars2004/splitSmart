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
  const [openDialog, setOpenDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupApi.getGroups();
      // Assuming the API client returns the data in the 'data' property:
      setGroups(response.data);
    } catch (error: any) {
      // Enhanced error logging:
      console.error("Failed to fetch groups:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewGroupName('');
    setNewGroupDescription('');
  };

  const handleCreateGroup = async () => {
    try {
      await groupApi.createGroup({
        name: newGroupName,
        description: newGroupDescription
      });
      handleCloseDialog();
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to create group:', error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      setError('Failed to create group');
    }
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
          onClick={handleOpenDialog}
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
                  <Button size="small">View Details</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateGroup} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default GroupList;
