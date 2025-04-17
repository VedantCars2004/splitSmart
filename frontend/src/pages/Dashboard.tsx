import React, { useState } from 'react';
import { 
  AppBar, Box, Toolbar, Typography, IconButton, 
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Tab, Tabs, Container, Button, Menu, MenuItem, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import GroupIcon from '@mui/icons-material/Group';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../contexts/AuthContext';
import GroupList from '../components/GroupList';
import InstanceList from '../components/InstanceList';
import BalanceList from '../components/BalanceList';
import ListItemButton from '@mui/material/ListItemButton';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { logout, currentUser } = useAuth();
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Handle profile menu
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleOpenProfileDialog = () => {
    handleProfileMenuClose();
    setProfileDialogOpen(true);
  };

  const handleCloseProfileDialog = () => {
    setProfileDialogOpen(false);
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // Here you would typically save the profile picture to your backend
    handleCloseProfileDialog();
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
      <List>
      <ListItem disablePadding>
        <ListItemButton onClick={() => setTabValue(0)}>
            <ListItemIcon>
            <GroupIcon />
            </ListItemIcon>
            <ListItemText primary="Groups" />
        </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
        <ListItemButton onClick={() => setTabValue(1)}>
            <ListItemIcon>
            <ShoppingCartIcon />
            </ListItemIcon>
            <ListItemText primary="Expenses" />
        </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
        <ListItemButton onClick={() => setTabValue(2)}>
            <ListItemIcon>
            <AccountBalanceWalletIcon />
            </ListItemIcon>
            <ListItemText primary="Balances" />
        </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
        <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
            <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
        </ListItemButton>
        </ListItem>

      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SplitSmart
          </Typography>
          
          {/* Profile Button */}
          <IconButton 
            color="inherit" 
            onClick={handleProfileMenuOpen}
            sx={{ mr: 1 }}
            aria-label="profile"
            aria-controls="profile-menu"
            aria-haspopup="true"
          >
            {profilePicture ? (
              <Avatar src={profilePicture} sx={{ width: 32, height: 32 }} />
            ) : (
              <AccountCircleIcon />
            )}
          </IconButton>
          
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        keepMounted
      >
        <MenuItem disabled>
          {currentUser?.email || "User"}
        </MenuItem>
        <MenuItem onClick={handleOpenProfileDialog}>Edit Profile</MenuItem>
      </Menu>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onClose={handleCloseProfileDialog}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
            <Avatar 
              src={profilePicture || undefined} 
              sx={{ width: 100, height: 100, mb: 2 }}
            />
            <Button
              variant="contained"
              component="label"
              sx={{ mb: 2 }}
            >
              Upload Picture
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleProfilePictureChange}
              />
            </Button>
            <TextField
              disabled
              fullWidth
              label="Email"
              value={currentUser?.email || ""}
              margin="normal"
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProfileDialog}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">
            <Tab label="Groups" id="simple-tab-0" aria-controls="simple-tabpanel-0" />
            <Tab label="Expenses" id="simple-tab-1" aria-controls="simple-tabpanel-1" />
            <Tab label="Balances" id="simple-tab-2" aria-controls="simple-tabpanel-2" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <Container>
            <GroupList />
          </Container>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Container>
            <InstanceList />
          </Container>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Container>
            <BalanceList />
          </Container>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default Dashboard;