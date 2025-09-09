import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	BriefcaseBusinessIcon,
	UsersIcon,
	BarChart3Icon,
	LogOutIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { clearAccessToken } from "@/lib/auth";
import { toast } from "sonner";

export function AppSidebar() {
	const navigate = useNavigate();
	const { setOpenMobile } = useSidebar();

	const handleLogout = () => {
		clearAccessToken();
		toast.success("Вы вышли из аккаунта");
		navigate({ to: "/" });
	};

	return (
		<Sidebar>
			<SidebarHeader className="h-12 border-b text-2xl font-bold flex flex-row items-center">
				<Link
					to="/"
					className="hover:text-blue-600 transition-colors"
					onClick={() => setOpenMobile(false)}
				>
					AI HR
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link to="/dashboard" onClick={() => setOpenMobile(false)}>
										<BarChart3Icon />
										Дашборд
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link to="/vacancies" onClick={() => setOpenMobile(false)}>
										<BriefcaseBusinessIcon />
										Вакансии
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link to="/candidates" onClick={() => setOpenMobile(false)}>
										<UsersIcon />
										Кандидаты
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="p-4">
				<Button
					variant="outline"
					onClick={handleLogout}
					className="w-full justify-start"
				>
					<LogOutIcon className="w-4 h-4 mr-2" />
					Выйти
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}
