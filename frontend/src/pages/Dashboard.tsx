import React, { useState } from 'react';
import { 
  AppBar, Box, Toolbar, Typography, IconButton, 
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Tab, Tabs, Container, Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import GroupIcon from '@mui/icons-material/Group';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
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
  const { logout } = useAuth();

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
            Split Expenses
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
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