import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Offer {
  id: number;
  title: string;
  description: string;
  reward: string;
  telegram_link: string;
  created_at: string;
}

const Index = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    reward: '',
    telegram_link: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    const response = await fetch('https://functions.poehali.dev/91b850a5-b60e-4115-8c7c-6741a57cceb9');
    const data = await response.json();
    setOffers(data.offers);
  };

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAdmin(true);
      toast({
        title: 'Вход выполнен',
        description: 'Добро пожаловать в панель управления'
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Неверный пароль',
        variant: 'destructive'
      });
    }
  };

  const handleCreateOffer = async () => {
    const response = await fetch('https://functions.poehali.dev/91b850a5-b60e-4115-8c7c-6741a57cceb9', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Auth': 'admin123'
      },
      body: JSON.stringify(newOffer)
    });

    if (response.ok) {
      toast({
        title: 'Успешно',
        description: 'Предложение создано'
      });
      setNewOffer({ title: '', description: '', reward: '', telegram_link: '' });
      fetchOffers();
    }
  };

  const handleDeleteOffer = async (id: number) => {
    const response = await fetch(`https://functions.poehali.dev/91b850a5-b60e-4115-8c7c-6741a57cceb9?id=${id}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Auth': 'admin123'
      }
    });

    if (response.ok) {
      toast({
        title: 'Успешно',
        description: 'Предложение удалено'
      });
      fetchOffers();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Заработок в Telegram</h1>
          <p className="text-sm mt-2 opacity-90">Актуальные предложения для заработка</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isAdmin && (
          <div className="mb-8 max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Панель администратора</CardTitle>
                <CardDescription>Введите пароль для доступа</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button onClick={handleLogin} className="w-full">
                  <Icon name="Lock" size={16} className="mr-2" />
                  Войти
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Создать новое предложение</CardTitle>
                <CardDescription>Добавьте информацию о способе заработка</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Название"
                  value={newOffer.title}
                  onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                />
                <Textarea
                  placeholder="Описание"
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                />
                <Input
                  placeholder="Награда (например: 500₽)"
                  value={newOffer.reward}
                  onChange={(e) => setNewOffer({ ...newOffer, reward: e.target.value })}
                />
                <Input
                  placeholder="Ссылка на Telegram"
                  value={newOffer.telegram_link}
                  onChange={(e) => setNewOffer({ ...newOffer, telegram_link: e.target.value })}
                />
                <Button onClick={handleCreateOffer} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать предложение
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="DollarSign" size={20} className="text-accent" />
                  {offer.title}
                </CardTitle>
                <CardDescription className="text-accent font-semibold">
                  {offer.reward}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{offer.description}</p>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a href={offer.telegram_link} target="_blank" rel="noopener noreferrer">
                      <Icon name="ExternalLink" size={16} className="mr-2" />
                      Перейти
                    </a>
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteOffer(offer.id)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {offers.length === 0 && (
          <div className="text-center py-12">
            <Icon name="Inbox" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Пока нет активных предложений</p>
          </div>
        )}
      </main>

      <footer className="bg-muted mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Платформа заработка в Telegram</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
