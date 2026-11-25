import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * 앱 전역 렌더링/라이프사이클 오류를 포착해 복구 화면을 제공하는 ErrorBoundary.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || '알 수 없는 오류가 발생했습니다.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <AlertTriangle size={28} color="#EF4444" />
          </View>
          <Text style={styles.title}>일시적인 오류가 발생했습니다</Text>
          <Text style={styles.description}>
            화면을 표시하는 중 문제가 발생했습니다. 아래 버튼을 눌러 다시 시도해 주세요.
          </Text>
          {Boolean(this.state.errorMessage) && (
            <View style={styles.detailBox}>
              <Text style={styles.detailText} numberOfLines={3}>
                {this.state.errorMessage}
              </Text>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={this.handleReset}
            style={styles.retryBtn}
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 20,
  },
  detailText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  retryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1B2A4A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
