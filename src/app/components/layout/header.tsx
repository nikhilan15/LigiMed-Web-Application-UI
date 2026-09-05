import { Bell, Search, User, Menu, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  userName?: string;
  notificationCount?: number;
  onMenuClick?: () => void;
  onLogout?: () => void;
}

export function Header({ 
  title, 
  subtitle, 
  showSearch = false, 
  userName = "User",
  notificationCount = 0,
  onMenuClick,
  onLogout
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showSearch && (
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search medicines, orders..."
                className="pl-10 w-64 text-xs"
              />
            </div>
          )}

          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center p-0 text-[10px]"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <Avatar>
              <AvatarFallback className="bg-blue-600 text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-gray-900 line-clamp-1">{userName}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Verified Active Account</p>
            </div>

            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                title="Sign Out of Account"
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 ml-1 h-9 px-2 rounded-lg gap-1 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
