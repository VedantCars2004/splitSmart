import React, { useState, useEffect } from 'react';
import { 
  Typography, Button, Card, CardContent, CardActions, 
  Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, MenuItem, Select, InputLabel,
  FormControl, Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { instanceApi, groupApi } from '../services/api';

interface Instance {
  id: number;
  name: string;
  date: string;
  description: string;
  items: any[];
}

interface Group {
  id: number;
  name: string;
}

const InstanceList: React.FC = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceDate, setNewInstanceDate] = useState('');
  const [newInstanceDescription, setNewInstanceDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [instancesResponse, groupsResponse] = await Promise.all([
        instanceApi.getInstances(),
        groupApi.getGroups()
      ]);
      setInstances(instancesResponse.data);
      setGroups(groupsResponse.data);
    } catch (error) {
      console.error(error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewInstanceName('');
    setNewInstanceDate('');
    setNewInstanceDescription('');
    setSelectedGroupId('');
  };

  const handleCreateInstance = async () => {
    try {
      // Prepare payload with the key 'group'
      const payload = {
        name: newInstanceName,
        date: newInstanceDate,
        description: newInstanceDescription,
        group: selectedGroupId  // selectedGroupId is a string containing the group ID
      };
      console.log('Creating instance with payload:', payload);
      await instanceApi.createInstance(payload);
      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      console.error('Failed to create instance', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      setError('Failed to create instance');
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
        <Typography variant="h4">Shopping Instances</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Shopping Trip
        </Button>
      </Box>

      {instances.length === 0 ? (
        <Typography>No shopping trips recorded yet.</Typography>
      ) : (
        <Grid container spacing={3}>
          {instances.map((instance) => (
            <Grid key={instance.id} >
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {instance.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {new Date(instance.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {instance.description}
                  </Typography>
                  <Typography variant="body2">
                    Items: {instance.items.length}
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
        <DialogTitle>Create New Shopping Trip</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Trip Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newInstanceName}
            onChange={(e) => setNewInstanceName(e.target.value)}
          />
          <TextField
            margin="dense"
            id="date"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            value={newInstanceDate}
            onChange={(e) => setNewInstanceDate(e.target.value)}
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
            value={newInstanceDescription}
            onChange={(e) => setNewInstanceDescription(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="group-select-label">Group</InputLabel>
            <Select
              labelId="group-select-label"
              id="group-select"
              value={selectedGroupId}
              label="Group"
              onChange={(e) => setSelectedGroupId(e.target.value as string)}
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateInstance} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InstanceList;
