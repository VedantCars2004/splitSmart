import React, { useState, useEffect } from 'react';
import { 
  Typography, Card, CardContent, Grid, CircularProgress, 
  List, ListItem, ListItemText, Divider, Box, Paper
} from '@mui/material';
import api from '../services/api';
import { balanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
interface Balance {
  id: number;
  from_user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  to_user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  amount: number;
}

const BalanceList: React.FC = () => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await balanceApi.getBalances();
      setBalances(response.data);
    } catch (error) {
      setError('Failed to fetch balances');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  const userId = currentUser?.uid;
  // Split balances into what I owe and what others owe me
  const iOwe = balances.filter(balance => balance.from_user.username === userId);
  const othersOweMe = balances.filter(balance => balance.to_user.username === userId);

  return (
    <div>
      <Typography variant="h4" gutterBottom>My Balances</Typography>
      
      <Grid container spacing={4}>
        <Grid> 
          <Paper elevation={3}>
            <Box sx={{ p: 2, bgcolor: 'error.light' }}>
              <Typography variant="h6">I Owe</Typography>
            </Box>
            <List>
              {iOwe.length === 0 ? (
                <ListItem>
                  <ListItemText primary="You don't owe anyone" />
                </ListItem>
              ) : (
                iOwe.map((balance) => (
                  <React.Fragment key={balance.id}>
                    <ListItem>
                      <ListItemText 
                        primary={`${balance.to_user.first_name} ${balance.to_user.last_name}`} 
                        secondary={`$${balance.amount.toFixed(2)}`} 
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid>
          <Paper elevation={3}>
            <Box sx={{ p: 2, bgcolor: 'success.light' }}>
              <Typography variant="h6">Others Owe Me</Typography>
            </Box>
            <List>
              {othersOweMe.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No one owes you" />
                </ListItem>
              ) : (
                othersOweMe.map((balance) => (
                  <React.Fragment key={balance.id}>
                    <ListItem>
                      <ListItemText 
                        primary={`${balance.from_user.first_name} ${balance.from_user.last_name}`} 
                        secondary={`$${balance.amount.toFixed(2)}`} 
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default BalanceList;