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
import { Link } from "@tanstack/react-router";
import { BriefcaseBusinessIcon, UsersIcon, BarChart3Icon } from "lucide-react";

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader className="h-12 border-b text-2xl font-bold flex flex-row items-center">
				AI HR
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link to="/dashboard">
										<BarChart3Icon />
										Дашборд
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link to="/vacancies">
										<BriefcaseBusinessIcon />
										Вакансии
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link to="/candidates">
										<UsersIcon />
										Кандидаты
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	);
}
