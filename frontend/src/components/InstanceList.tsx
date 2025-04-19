import React, { useState, useEffect } from 'react';
import { 
  Typography, Button, Card, CardContent, CardActions, 
  Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, MenuItem, Select, InputLabel,
  FormControl, Box, OutlinedInput, Chip, IconButton,
  DialogContentText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { instanceApi, groupApi, itemApi } from '../services/api';

interface Instance {
  id: number;
  name: string;
  date: string;
  description: string;
  items: any[];
  group: number; // Instance belongs to a group
}

interface Group {
  id: number;
  name: string;
  members: User[];
}

interface User {
  id: number;
  username: string;
  email: string;
}

// Add a new interface for edit item state
interface EditItemState {
  id: number;
  name: string;
  price: number;
  selectedUserIds: string[];
}

const InstanceList: React.FC = () => {
  // State for instance list and groups (for instance creation)
  const [instances, setInstances] = useState<Instance[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for creating a new instance (shopping trip)
  const [openInstanceDialog, setOpenInstanceDialog] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceDate, setNewInstanceDate] = useState('');
  const [newInstanceDescription, setNewInstanceDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // State for instance details dialog (when "View Details" is clicked)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);

  // State for adding a new item inside an instance
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // State for edit item dialog
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editItem, setEditItem] = useState<EditItemState | null>(null);

  // State for delete instance confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);

  // Fetch instance list and groups on mount.
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

  // --- New Instance (Shopping Trip) Dialog Handlers ---
  const handleOpenInstanceDialog = () => {
    setOpenInstanceDialog(true);
  };

  const handleCloseInstanceDialog = () => {
    setOpenInstanceDialog(false);
    setNewInstanceName('');
    setNewInstanceDate('');
    setNewInstanceDescription('');
    setSelectedGroupId('');
  };

  const handleCreateInstance = async () => {
    try {
      // Prepare payload with key 'group'
      const payload = {
        name: newInstanceName,
        date: newInstanceDate,
        description: newInstanceDescription,
        group: selectedGroupId  // selectedGroupId as string
      };
      console.log('Creating instance with payload:', payload);
      await instanceApi.createInstance(payload);
      handleCloseInstanceDialog();
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

  // --- Instance Details Handlers (to view items and add new item) ---
  const handleOpenDetailsDialog = async (instance: Instance) => {
    setSelectedInstance(instance);
    setOpenDetailsDialog(true);
    // Fetch group members for the instance's group using groupApi.getGroup
    try {
      const response = await groupApi.getGroup(instance.group.toString());
      // Assume the response has a 'members' field
      setGroupMembers(response.data.members);
    } catch (err) {
      console.error('Failed to fetch group members:', err);
      setError('Failed to fetch group members');
    }
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedInstance(null);
    setNewItemName('');
    setNewItemPrice(0);
    setSelectedUserIds([]);
  };

  const handleCreateItem = async () => {
    if (!selectedInstance) return;
    try {
      const payload = {
        instance: selectedInstance.id,
        name: newItemName,
        price: newItemPrice,
        shared_with: Array.isArray(selectedUserIds) ? selectedUserIds : [selectedUserIds]
      };
      console.log('Creating item with payload:', payload);
      
      const response = await itemApi.createItem(payload);
      console.log('Success response:', response);
      
      // Reset form
      setNewItemName('');
      setNewItemPrice(0);
      setSelectedUserIds([]);
      
      // Refresh instance details
      refreshInstanceDetails(selectedInstance.id);
    } catch (error: any) {
      console.error('Failed to create item:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        
        // Get more details from the error response
        const errorText = typeof error.response.data === 'string' 
          ? error.response.data
          : JSON.stringify(error.response.data);
          
        console.error('Error details:', errorText);
      }
      setError('Failed to create item');
    }
  };

  // --- Edit and Delete Item Handlers ---
  const handleDeleteItem = async (itemId: number) => {
    try {
      await itemApi.deleteItem(itemId.toString()); // Convert id to string
      // Refresh instance details if currently viewing
      if (selectedInstance) {
        refreshInstanceDetails(selectedInstance.id);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      setError('Failed to delete item');
    }
  };

  const handleOpenEditDialog = (item: any) => {
    // Get current user IDs from shared_with
    const userIds = item.shared_with ? 
      item.shared_with.map((share: any) => share.user.id.toString()) : [];
    
    setEditItem({
      id: item.id,
      name: item.name,
      price: item.price,
      selectedUserIds: userIds
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditItem(null);
  };

  const handleUpdateItem = async () => {
    if (!editItem) return;
    try {
      const payload = {
        name: editItem.name,
        price: editItem.price,
        shared_with: editItem.selectedUserIds
      };
      
      await itemApi.updateItem(editItem.id.toString(), payload); // Convert id to string
      handleCloseEditDialog();
      
      // Refresh instance details if currently viewing
      if (selectedInstance) {
        refreshInstanceDetails(selectedInstance.id);
      }
    } catch (error: any) {
      console.error('Failed to update item:', error);
      setError('Failed to update item');
    }
  };

  // --- Delete Instance Handlers ---
  const handleOpenDeleteDialog = (instance: Instance) => {
    setInstanceToDelete(instance);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setInstanceToDelete(null);
  };

  const handleDeleteInstance = async () => {
    if (!instanceToDelete) return;
    
    try {
      await instanceApi.deleteInstance(instanceToDelete.id.toString());
      handleCloseDeleteDialog();
      // Refresh the instances list
      fetchData();
    } catch (error) {
      console.error('Failed to delete instance:', error);
      setError('Failed to delete instance');
    }
  };

  // Helper function to refresh instance details
  const refreshInstanceDetails = async (instanceId: number) => {
    try {
      const response = await instanceApi.getInstance(instanceId.toString()); // Convert id to string
      setSelectedInstance(response.data);
    } catch (error) {
      console.error('Failed to refresh instance details:', error);
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
      {/* Instance (Shopping Trip) List */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Shopping Instances</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenInstanceDialog}
        >
          New Shopping Trip
        </Button>
      </Box>

      {instances.length === 0 ? (
        <Typography>No shopping trips recorded yet.</Typography>
      ) : (
        <Grid container spacing={3}>
          {instances.map((instance) => (
            <Grid key={instance.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5">{instance.name}</Typography>
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
                  <Button size="small" onClick={() => handleOpenDetailsDialog(instance)}>
                    View Details
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={() => handleOpenDeleteDialog(instance)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create New Instance Dialog */}
      <Dialog open={openInstanceDialog} onClose={handleCloseInstanceDialog}>
        <DialogTitle>Create New Shopping Trip</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Trip Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newInstanceName}
            onChange={(e) => setNewInstanceName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={newInstanceDate}
            onChange={(e) => setNewInstanceDate(e.target.value)}
          />
          <TextField
            margin="dense"
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
          <Button onClick={handleCloseInstanceDialog}>Cancel</Button>
          <Button onClick={handleCreateInstance} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Instance Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} fullWidth maxWidth="sm">
        <DialogTitle>Instance Details</DialogTitle>
        <DialogContent>
          {selectedInstance && (
            <Box>
              <Typography variant="h5">{selectedInstance.name}</Typography>
              <Typography>Date: {new Date(selectedInstance.date).toLocaleDateString()}</Typography>
              <Typography>{selectedInstance.description}</Typography>
              <Typography sx={{ mt: 2 }} variant="h6">Items</Typography>
              {selectedInstance.items.length === 0 ? (
                <Typography>No items recorded for this instance.</Typography>
              ) : (
                selectedInstance.items.map((item: any) => (
                  <Box key={item.id} mb={1} sx={{ 
                    p: 2, 
                    border: '1px solid #ddd', 
                    borderRadius: 1, 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="subtitle1">{item.name} - ${item.price}</Typography>
                      <Typography variant="body2">
                        Shared With: {item.shared_with && item.shared_with.map((u: any) => u.user.username).join(', ')}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(item)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteItem(item.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              )}
              {/* Add Item Section */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">Add New Item</Typography>
                <TextField
                  margin="dense"
                  label="Item Name"
                  fullWidth
                  variant="outlined"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <TextField
                  margin="dense"
                  label="Price"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(parseFloat(e.target.value))}
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel id="shared-with-label">Share With</InputLabel>
                  <Select
                    labelId="shared-with-label"
                    multiple
                    value={selectedUserIds}
                    onChange={(e) => setSelectedUserIds(e.target.value as string[])}
                    input={<OutlinedInput label="Share With" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => {
                          const member = groupMembers.find(m => m.id.toString() === value);
                          return <Chip key={value} label={member ? member.username : value} />;
                        })}
                      </Box>
                    )}
                  >
                    {groupMembers.map((member) => (
                      <MenuItem key={member.id} value={member.id.toString()}>
                        {member.username} ({member.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button onClick={handleCreateItem} variant="contained" sx={{ mt: 2 }}>
                  Add Item
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Item Name"
            fullWidth
            variant="outlined"
            value={editItem?.name || ''}
            onChange={(e) => setEditItem(prev => prev ? {...prev, name: e.target.value} : null)}
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            variant="outlined"
            value={editItem?.price || 0}
            onChange={(e) => setEditItem(prev => prev ? {...prev, price: parseFloat(e.target.value)} : null)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="edit-shared-with-label">Share With</InputLabel>
            <Select
              labelId="edit-shared-with-label"
              multiple
              value={editItem?.selectedUserIds || []}
              onChange={(e) => setEditItem(prev => prev ? {...prev, selectedUserIds: e.target.value as string[]} : null)}
              input={<OutlinedInput label="Share With" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => {
                    const member = groupMembers.find(m => m.id.toString() === value);
                    return <Chip key={value} label={member ? member.username : value} />;
                  })}
                </Box>
              )}
            >
              {groupMembers.map((member) => (
                <MenuItem key={member.id} value={member.id.toString()}>
                  {member.username} ({member.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateItem} variant="contained">Update Item</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Instance Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the shopping trip "{instanceToDelete?.name}"? 
            This will permanently remove all items and related balances within this trip.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteInstance} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InstanceList;