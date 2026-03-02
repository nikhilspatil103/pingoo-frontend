## Add Interested In Field to EditProfileScreenV2

Add this state variable:
```javascript
const [interestedIn, setInterestedIn] = useState(userProfile?.interestedIn || '');
```

Add this section in the form (after gender or before lookingFor):
```javascript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Interested In</Text>
  <View style={styles.optionsRow}>
    {[
      { key: 'male', label: 'Men', icon: '♂' },
      { key: 'female', label: 'Women', icon: '♀' },
      { key: 'both', label: 'Both', icon: '⚤' }
    ].map((option) => (
      <TouchableOpacity
        key={option.key}
        style={[styles.optionCard, interestedIn === option.key && styles.selectedCard]}
        onPress={() => setInterestedIn(option.key)}
      >
        <Text style={styles.optionIcon}>{option.icon}</Text>
        <Text style={[styles.optionLabel, interestedIn === option.key && styles.selectedLabel]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
```

Add interestedIn to the save function:
```javascript
const updatedData = {
  ...existingFields,
  interestedIn,  // Add this line
};
```

This will allow users to change their interested-in preference and the home screen will automatically show profiles matching their new preference.
