/**
 * AI Assistant Screen
 * Gemini-powered investment assistant chatbot
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme/typography';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const AIAssistantScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      text: "Hello! I'm DIA Assistant, your AI-powered investment advisor. I can help you with:\n\n- Investment recommendations\n- Fund analysis\n- Market insights\n- Portfolio optimization\n- Green energy investment tips\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  const quickActions = [
    { icon: 'leaf', text: 'Green Funds', query: 'Tell me about green energy investment funds' },
    { icon: 'trending-up', text: 'Best Returns', query: 'Which funds have the best returns?' },
    { icon: 'shield-checkmark', text: 'Low Risk', query: 'What are the safest investment options?' },
    { icon: 'bulb', text: 'Tips', query: 'Give me some investment tips for beginners' },
  ];

  const systemPrompt = `You are DIA Assistant, an AI investment advisor for the DIA (Digital Investment Accelerator) app focused on green energy and sustainable investments in Azerbaijan and the Caspian region.

Key facts about DIA:
- DIA offers three main funds: Energy Transition Fund (conservative, 6.5% returns), Balanced Fund (moderate, 9.2% returns), and ICT Innovation Fund (aggressive, 14.8% returns)
- All investments are in AZN (Azerbaijani Manat)
- Focus areas: Green energy, renewable infrastructure, ICT, and sustainable technology
- Features: Round-up micro-investments, direct deposits, portfolio tracking

Guidelines:
- Be helpful, friendly, and professional
- Provide investment advice but remind users to do their own research
- Focus on green/sustainable investments
- Keep responses concise but informative
- Use simple language for complex financial concepts
- If asked about specific stock prices, remind that you provide general guidance, not real-time data`;

  const sendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: `User question: ${text.trim()}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      });

      const data = await response.json();
      console.log('Gemini API Response:', JSON.stringify(data, null, 2));

      let botResponse = "I apologize, but I couldn't process your request. Please try again.";

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        botResponse = data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        console.log('Gemini API Error:', data.error);
        botResponse = `API Error: ${data.error.message || 'Unknown error'}`;
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: botResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.log('AI Error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isBot = item.type === 'bot';
    return (
      <View style={[
        styles.messageContainer,
        isBot ? styles.botMessageContainer : styles.userMessageContainer,
      ]}>
        {isBot && (
          <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isBot
            ? [styles.botBubble, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]
            : [styles.userBubble, { backgroundColor: theme.primary }],
        ]}>
          <Text style={[
            styles.messageText,
            { color: isBot ? theme.textPrimary : '#FFFFFF' },
          ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: theme.primary }]}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>DIA Assistant</Text>
            <Text style={[styles.headerSubtitle, { color: theme.success }]}>Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <FlatList
          horizontal
          data={quickActions}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsList}
          keyExtractor={(item) => item.text}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}
              onPress={() => sendMessage(item.query)}
            >
              <Ionicons name={item.icon} size={16} color={theme.primary} />
              <Text style={[styles.quickActionText, { color: theme.textPrimary }]}>{item.text}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.loadingBubble, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Thinking...</Text>
            </View>
          </View>
        ) : null}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.backgroundLight, borderTopColor: theme.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              placeholder="Ask me anything about investments..."
              placeholderTextColor={theme.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: inputText.trim() ? theme.primary : theme.border }]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons name="send" size={18} color={inputText.trim() ? '#FFFFFF' : theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
  },
  moreButton: {
    padding: spacing.xs,
  },
  quickActionsContainer: {
    paddingVertical: spacing.sm,
  },
  quickActionsList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  quickActionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  botBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderTopRightRadius: 4,
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: spacing.xs,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  inputContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});

export default AIAssistantScreen;
