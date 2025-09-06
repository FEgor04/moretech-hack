import { candidateQueryOptions } from '@/api/queries/candidates';
import { interviewMessagesQueryOptions, interviewQueryOptions } from '@/api/queries/interviews';
import { vacancyQueryOptions } from '@/api/queries/vacancies';
import { useInitializeFirstMessageMutation, usePostInterviewMessageMutation } from '@/api/mutations/interviews';
import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageCircle, Clock, FileText, Play, Send, User, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute('/interviews/$interviewId')({
  component: RouteComponent,
})

function RouteComponent() {
    const params = Route.useParams();
    const messages = useSuspenseQuery(interviewMessagesQueryOptions(params.interviewId));

    if(messages.data.length === 0) {
        return <StartInterview interviewId={params.interviewId} />
    }

    return <InterviewChat interviewId={params.interviewId} />
}

function StartInterview({ interviewId }: { interviewId: string }) {
    const interview = useSuspenseQuery(interviewQueryOptions(interviewId));
    const candidate = useSuspenseQuery(candidateQueryOptions(interview.data.candidate_id));
    const vacancy = interview.data.vacancy_id 
        ? useSuspenseQuery(vacancyQueryOptions(interview.data.vacancy_id))
        : null;
    
    const initializeFirstMessageMutation = useInitializeFirstMessageMutation();

    const handleStartInterview = () => {
        initializeFirstMessageMutation.mutate(interviewId, {
            onSuccess: () => {
                toast.success('Собеседование началось!');
            },
            onError: (error) => {
                toast.error('Ошибка при запуске собеседования');
                console.error('Failed to initialize first message:', error);
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Добро пожаловать на собеседование!
                    </h1>
                    <p className="text-xl text-gray-600">
                        Здравствуйте, <span className="font-semibold text-indigo-600">{candidate.data.name}</span>!
                    </p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Interview Info Card */}
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-6 w-6 text-indigo-600" />
                                    Информация о собеседовании
                                </CardTitle>
                                <CardDescription>
                                    Подробная информация о формате и процессе собеседования
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {vacancy && (
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Позиция</h3>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary" className="text-sm">
                                                {vacancy.data.title}
                                            </Badge>
                                        </div>
                                        {vacancy.data.description && (
                                            <p className="text-gray-600 text-sm whitespace-pre-line">
                                                {vacancy.data.description}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-semibold text-lg mb-3">Формат собеседования</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-indigo-100 p-2 rounded-lg">
                                                <MessageCircle className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">Интерактивный чат</h4>
                                                <p className="text-sm text-gray-600">
                                                    Собеседование проходит в формате диалога с ИИ-ассистентом
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-3">
                                            <div className="bg-green-100 p-2 rounded-lg">
                                                <Clock className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">Гибкое время</h4>
                                                <p className="text-sm text-gray-600">
                                                    Вы можете проходить собеседование в удобное для вас время
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-3">
                                            <div className="bg-purple-100 p-2 rounded-lg">
                                                <FileText className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">Автоматическая оценка</h4>
                                                <p className="text-sm text-gray-600">
                                                    Ваши ответы будут проанализированы системой ИИ
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-900 mb-2">Что ожидать:</h4>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Вопросы будут касаться вашего опыта и навыков</li>
                                        <li>• Отвечайте честно и подробно</li>
                                        <li>• Не торопитесь, обдумайте каждый ответ</li>
                                        <li>• Вы можете задавать уточняющие вопросы</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Start Interview Card */}
                    <div>
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Play className="h-6 w-6 text-green-600" />
                                    Начать собеседование
                                </CardTitle>
                                <CardDescription>
                                    Готовы начать? Нажмите кнопку ниже
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col justify-center h-full">
                                <div className="text-center space-y-4">
                                    <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                                        <Play className="h-12 w-12 text-green-600" />
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Всё готово!</h3>
                                        <p className="text-sm text-gray-600 mb-6">
                                            Когда будете готовы, нажмите кнопку "Начать собеседование"
                                        </p>
                                    </div>

                                    <Button 
                                        onClick={handleStartInterview}
                                        disabled={initializeFirstMessageMutation.isPending}
                                        size="lg"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {initializeFirstMessageMutation.isPending ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Запуск...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-4 w-4 mr-2" />
                                                Начать собеседование
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Если у вас возникли технические проблемы, обратитесь к администратору
                    </p>
                </div>
            </div>
        </div>
    );
}

function InterviewChat({ interviewId }: { interviewId: string }) {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const interview = useSuspenseQuery(interviewQueryOptions(interviewId));
    const candidate = useSuspenseQuery(candidateQueryOptions(interview.data.candidate_id));
    const vacancy = interview.data.vacancy_id 
        ? useSuspenseQuery(vacancyQueryOptions(interview.data.vacancy_id))
        : null;
    
    // Poll messages every 1000ms
    const messages = useQuery({
        ...interviewMessagesQueryOptions(interviewId),
        refetchInterval: 1000,
    });
    
    const postMessageMutation = usePostInterviewMessageMutation();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages.data]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || postMessageMutation.isPending) return;

        const messageText = message.trim();
        setMessage('');

        postMessageMutation.mutate({
            interviewId,
            message: {
                text: messageText,
                type: 'user'
            }
        }, {
            onError: (error) => {
                toast.error('Ошибка при отправке сообщения');
                console.error('Failed to send message:', error);
                setMessage(messageText); // Restore message on error
            }
        });
    };

    if (messages.isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Загрузка собеседования...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Собеседование
                            </h1>
                            <p className="text-gray-600">
                                {candidate.data.name} • {vacancy?.data.title || 'Общее собеседование'}
                            </p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Активно
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.data?.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`flex items-start gap-3 max-w-[80%] ${
                                    msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                                }`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                        msg.type === 'user'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {msg.type === 'user' ? (
                                        <User className="h-4 w-4" />
                                    ) : (
                                        <Bot className="h-4 w-4" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div
                                    className={`px-4 py-3 rounded-2xl ${
                                        msg.type === 'user'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-900'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 bg-white p-6">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Введите ваше сообщение..."
                            disabled={postMessageMutation.isPending}
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={!message.trim() || postMessageMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {postMessageMutation.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
