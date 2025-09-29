// src/features/goods/GoodsRouter.tsx
import { useAuth } from "../../store/AuthContext";
import GoodsRequestsList from "./GoodsRequestsList";
import ServiceAdvisorGoodsRequests from "./ServiceAdvisorGoodsRequests";

export default function GoodsRouter() {
  const { user } = useAuth();

  // If user is a service advisor, show their personal goods requests
  if (user?.role === 'service_advisor') {
    return <ServiceAdvisorGoodsRequests />;
  }

  // For other roles (admin, owner, cashier), show all pending goods requests
  return <GoodsRequestsList mode="pending" />;
}