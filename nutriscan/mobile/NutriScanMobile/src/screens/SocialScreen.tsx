import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SocialScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Community Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default SocialScreen;
